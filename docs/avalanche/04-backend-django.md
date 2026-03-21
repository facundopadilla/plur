# 04 — Backend Django: web3.py, Mint/Burn, Eventos

## Instalación de dependencias

```bash
cd backend
uv add web3 eth-account
```

O con pip:
```bash
pip install web3==6.x eth-account
```

---

## Conexión a Avalanche C-Chain

```python
# apps/credits/blockchain.py

from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware
from django.conf import settings
import json
import os

# ABIs mínimos necesarios (solo las funciones que usamos)
PLR_TOKEN_ABI = [
    {
        "inputs": [
            {"name": "to", "type": "address"},
            {"name": "amount", "type": "uint256"},
            {"name": "reason", "type": "string"},
            {"name": "referenceId", "type": "bytes32"}
        ],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "from", "type": "address"},
            {"name": "amount", "type": "uint256"},
            {"name": "reason", "type": "string"},
            {"name": "referenceId", "type": "bytes32"}
        ],
        "name": "burnFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
]


def get_web3() -> Web3:
    """Retorna una instancia de Web3 conectada a Avalanche C-Chain."""
    rpc_url = settings.AVALANCHE_RPC_URL
    w3 = Web3(Web3.HTTPProvider(rpc_url))

    # Avalanche C-Chain usa PoS, no necesita POA middleware.
    # Pero Fuji testnet a veces lo necesita — dejarlo no hace daño.
    w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)

    if not w3.is_connected():
        raise ConnectionError(f"No se pudo conectar a Avalanche RPC: {rpc_url}")

    return w3


def get_plr_token_contract(w3: Web3):
    """Retorna el contrato PLRToken listo para usar."""
    return w3.eth.contract(
        address=Web3.to_checksum_address(settings.PLR_TOKEN_ADDRESS),
        abi=PLR_TOKEN_ABI,
    )


def get_backend_account(w3: Web3):
    """Carga la cuenta del backend desde la private key en settings."""
    from eth_account import Account
    account = Account.from_key(settings.AVALANCHE_BACKEND_PRIVATE_KEY)
    return account
```

---

## Configuración en Django settings

```python
# config/settings/base.py

# Avalanche
AVALANCHE_RPC_URL = os.getenv(
    "AVALANCHE_RPC_URL",
    "https://api.avax-test.network/ext/bc/C/rpc"  # Fuji testnet por defecto
)
AVALANCHE_BACKEND_PRIVATE_KEY = os.getenv("AVALANCHE_BACKEND_PRIVATE_KEY", "")
PLR_TOKEN_ADDRESS = os.getenv("PLR_TOKEN_ADDRESS", "")
PLR_STAKING_ADDRESS = os.getenv("PLR_STAKING_ADDRESS", "")

# Equivalencia FIAT-créditos (configurable sin deploy de contratos)
PLR_PRICE_ARS_PER_100 = 500       # ARS 500 = 100 créditos
PLR_AI_IMAGE_COST = 5              # 5 créditos por imagen generada
PLR_SUBSCRIPTION_CREDITS = 200    # Créditos por suscripción mensual
PLR_SALE_REWARD_PERCENT = 10      # 10% del precio de venta como reward en créditos
```

---

## Servicio de créditos

```python
# apps/credits/services.py

import uuid
import hashlib
from decimal import Decimal
from loguru import logger
from web3 import Web3
from eth_account import Account

from django.conf import settings
from .blockchain import get_web3, get_plr_token_contract, get_backend_account


class CreditService:
    """
    Servicio central para operaciones con créditos PLR.

    Todas las operaciones son síncronas para el MVP.
    En producción, considerar hacerlas asíncronas con Celery.
    """

    @classmethod
    def _build_reference_id(cls, django_id: str) -> bytes:
        """Convierte un ID de Django a bytes32 para el contrato."""
        return hashlib.sha256(django_id.encode()).digest()

    @classmethod
    def get_balance(cls, wallet_address: str) -> int:
        """
        Obtiene el balance de PLR de una wallet.

        Returns:
            Balance en unidades enteras (no en wei).
            Ej: si el balance on-chain es 150 * 10^18, retorna 150.
        """
        w3 = get_web3()
        contract = get_plr_token_contract(w3)
        balance_wei = contract.functions.balanceOf(
            Web3.to_checksum_address(wallet_address)
        ).call()
        return int(Web3.from_wei(balance_wei, 'ether'))

    @classmethod
    def mint_credits(
        cls,
        to_wallet: str,
        amount: int,
        reason: str,
        django_reference_id: str,
    ) -> str:
        """
        Mintea `amount` créditos PLR a la wallet especificada.

        Args:
            to_wallet: Dirección de la wallet Ethereum del usuario
            amount: Créditos a emitir (unidades, no wei)
            reason: "purchase" | "subscription" | "sale_reward"
            django_reference_id: UUID de la transacción en la DB de Django

        Returns:
            Hash de la transacción on-chain

        Raises:
            Exception si la transacción falla
        """
        w3 = get_web3()
        contract = get_plr_token_contract(w3)
        backend_account = get_backend_account(w3)

        amount_wei = Web3.to_wei(amount, 'ether')
        ref_bytes = cls._build_reference_id(django_reference_id)

        # Construir la transacción
        nonce = w3.eth.get_transaction_count(backend_account.address)
        gas_price = w3.eth.gas_price

        tx = contract.functions.mint(
            Web3.to_checksum_address(to_wallet),
            amount_wei,
            reason,
            ref_bytes,
        ).build_transaction({
            'from': backend_account.address,
            'nonce': nonce,
            'gas': 200_000,
            'gasPrice': gas_price,
            'chainId': 43113,  # Fuji; cambiar a 43114 para mainnet
        })

        # Firmar y enviar
        signed_tx = w3.eth.account.sign_transaction(tx, backend_account.key)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)

        # Esperar confirmación (timeout 30s)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)

        if receipt['status'] != 1:
            raise Exception(f"Transacción de mint fallida: {tx_hash.hex()}")

        logger.info(
            "Créditos emitidos on-chain",
            wallet=to_wallet,
            amount=amount,
            reason=reason,
            tx_hash=tx_hash.hex(),
        )

        return tx_hash.hex()

    @classmethod
    def burn_credits(
        cls,
        from_wallet: str,
        amount: int,
        reason: str,
        django_reference_id: str,
    ) -> str:
        """
        Quema `amount` créditos PLR de la wallet especificada.

        IMPORTANTE: El contrato PLRToken.burnFrom() requiere que el backend
        (BURNER_ROLE) esté aprobado para quemar tokens del usuario.
        En el setup inicial, se hace esto en el backend cuando se crea
        la wallet del usuario (approve al backend wallet).

        Args:
            from_wallet: Wallet del usuario
            amount: Créditos a quemar
            reason: "ai_generation" | "clothing_purchase" | "fee"
            django_reference_id: UUID de la operación en Django

        Returns:
            Hash de la transacción
        """
        w3 = get_web3()
        contract = get_plr_token_contract(w3)
        backend_account = get_backend_account(w3)

        amount_wei = Web3.to_wei(amount, 'ether')
        ref_bytes = cls._build_reference_id(django_reference_id)

        nonce = w3.eth.get_transaction_count(backend_account.address)

        tx = contract.functions.burnFrom(
            Web3.to_checksum_address(from_wallet),
            amount_wei,
            reason,
            ref_bytes,
        ).build_transaction({
            'from': backend_account.address,
            'nonce': nonce,
            'gas': 150_000,
            'gasPrice': w3.eth.gas_price,
            'chainId': 43113,
        })

        signed_tx = w3.eth.account.sign_transaction(tx, backend_account.key)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)

        if receipt['status'] != 1:
            raise Exception(f"Transacción de burn fallida: {tx_hash.hex()}")

        logger.info(
            "Créditos quemados on-chain",
            wallet=from_wallet,
            amount=amount,
            reason=reason,
            tx_hash=tx_hash.hex(),
        )

        return tx_hash.hex()

    @classmethod
    def transfer_credits(
        cls,
        from_wallet: str,
        to_wallet: str,
        amount: int,
        django_reference_id: str,
    ) -> str:
        """
        Transfiere créditos de un usuario a otro (P2P).
        Similar a burn + mint pero en una sola tx.
        """
        # Para el MVP, se implementa como burn del emisor + mint al receptor
        # Esto es más simple que manejar approvals del usuario
        burn_tx = cls.burn_credits(from_wallet, amount, "p2p_transfer", django_reference_id + "_burn")
        mint_tx = cls.mint_credits(to_wallet, amount, "p2p_received", django_reference_id + "_mint")
        return mint_tx
```

---

## Modelo de datos en Django

```python
# apps/credits/models.py

import uuid
from django.db import models
from django.conf import settings


class CreditTransaction(models.Model):
    """Registro de todas las transacciones de créditos."""

    class TxType(models.TextChoices):
        MINT = "mint", "Emisión"
        BURN = "burn", "Consumo"
        TRANSFER_OUT = "transfer_out", "Transferencia enviada"
        TRANSFER_IN = "transfer_in", "Transferencia recibida"
        STAKE = "stake", "Staking"
        UNSTAKE = "unstake", "Unstaking"
        REWARD = "reward", "Recompensa de staking"

    class Reason(models.TextChoices):
        PURCHASE = "purchase", "Compra de créditos"
        SUBSCRIPTION = "subscription", "Suscripción mensual"
        SALE_REWARD = "sale_reward", "Reward por venta de prenda"
        AI_GENERATION = "ai_generation", "Generación de imagen IA"
        CLOTHING_PURCHASE = "clothing_purchase", "Compra de prenda"
        P2P_TRANSFER = "p2p_transfer", "Transferencia P2P"
        FEE = "fee", "Comisión de plataforma"

    class Status(models.TextChoices):
        PENDING = "pending", "Pendiente"
        CONFIRMED = "confirmed", "Confirmado on-chain"
        FAILED = "failed", "Fallido"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="credit_transactions",
    )
    tx_type = models.CharField(max_length=20, choices=TxType.choices)
    reason = models.CharField(max_length=30, choices=Reason.choices)
    amount = models.PositiveIntegerField()  # En créditos enteros
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    tx_hash = models.CharField(max_length=66, blank=True)  # Hash de la tx on-chain
    wallet_address = models.CharField(max_length=42, blank=True)
    related_object_id = models.CharField(max_length=100, blank=True)  # ID de prenda, sesión IA, etc.
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["tx_hash"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.user} | {self.tx_type} {self.amount} PLR | {self.status}"


class UserWallet(models.Model):
    """Asociación entre usuario de Plur y su wallet Ethereum (creada por Privy)."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="wallet",
    )
    address = models.CharField(max_length=42, unique=True)  # 0x...
    privy_user_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Cache del balance para respuestas rápidas
    # Se actualiza en cada transacción y por polling periódico
    cached_balance = models.PositiveIntegerField(default=0)
    balance_updated_at = models.DateTimeField(null=True)

    def __str__(self):
        return f"{self.user.email} → {self.address}"
```

---

## Endpoints Django Ninja

```python
# apps/credits/api.py

from ninja import Router, Schema
from django.http import HttpRequest
from .services import CreditService
from .models import CreditTransaction, UserWallet

router = Router(tags=["credits"])


class CreditBalanceOut(Schema):
    balance: int
    wallet_address: str


class SpendCreditsIn(Schema):
    amount: int
    reason: str
    related_object_id: str = ""


class SpendCreditsOut(Schema):
    new_balance: int
    tx_hash: str


class TransactionOut(Schema):
    id: str
    tx_type: str
    reason: str
    amount: int
    status: str
    tx_hash: str
    created_at: str


@router.get("/balance", response=CreditBalanceOut)
async def get_balance(request: HttpRequest):
    """Retorna el balance de créditos del usuario logueado."""
    user = request.auth
    wallet = await UserWallet.objects.aget(user=user)

    # Para respuesta rápida, usar cache; refrescar en background si está desactualizado
    balance = wallet.cached_balance

    return {"balance": balance, "wallet_address": wallet.address}


@router.post("/spend", response={200: SpendCreditsOut, 400: dict, 402: dict})
async def spend_credits(request: HttpRequest, payload: SpendCreditsIn):
    """
    Gasta créditos (burn on-chain).
    Llamado cuando el usuario genera una imagen IA, compra una prenda, etc.
    """
    user = request.auth
    wallet = await UserWallet.objects.aget(user=user)

    if wallet.cached_balance < payload.amount:
        return 402, {"detail": "Créditos insuficientes"}

    tx_record = await CreditTransaction.objects.acreate(
        user=user,
        tx_type=CreditTransaction.TxType.BURN,
        reason=payload.reason,
        amount=payload.amount,
        wallet_address=wallet.address,
        related_object_id=payload.related_object_id,
    )

    try:
        tx_hash = CreditService.burn_credits(
            from_wallet=wallet.address,
            amount=payload.amount,
            reason=payload.reason,
            django_reference_id=str(tx_record.id),
        )

        tx_record.status = CreditTransaction.Status.CONFIRMED
        tx_record.tx_hash = tx_hash
        await tx_record.asave()

        wallet.cached_balance -= payload.amount
        await wallet.asave()

        return 200, {
            "new_balance": wallet.cached_balance,
            "tx_hash": tx_hash,
        }

    except Exception as e:
        tx_record.status = CreditTransaction.Status.FAILED
        await tx_record.asave()
        return 400, {"detail": "Error al procesar la transacción. Intente de nuevo."}


@router.get("/history", response=list[TransactionOut])
async def get_history(request: HttpRequest):
    """Historial de transacciones de créditos del usuario."""
    user = request.auth
    txs = CreditTransaction.objects.filter(user=user).order_by("-created_at")[:50]
    return [
        {
            "id": str(tx.id),
            "tx_type": tx.tx_type,
            "reason": tx.reason,
            "amount": tx.amount,
            "status": tx.status,
            "tx_hash": tx.tx_hash,
            "created_at": tx.created_at.isoformat(),
        }
        async for tx in txs
    ]
```

---

## Lectura de eventos on-chain (sync periódico)

Para mantener el `cached_balance` actualizado con la fuente de verdad on-chain:

```python
# apps/credits/management/commands/sync_balances.py

from django.core.management.base import BaseCommand
from apps.credits.models import UserWallet
from apps.credits.blockchain import get_web3, get_plr_token_contract
from web3 import Web3
from django.utils import timezone


class Command(BaseCommand):
    help = "Sincroniza los balances de PLR desde la blockchain"

    def handle(self, *args, **kwargs):
        w3 = get_web3()
        contract = get_plr_token_contract(w3)

        wallets = UserWallet.objects.select_related("user").all()
        updated = 0

        for wallet in wallets:
            try:
                balance_wei = contract.functions.balanceOf(
                    Web3.to_checksum_address(wallet.address)
                ).call()
                balance = int(Web3.from_wei(balance_wei, 'ether'))

                if balance != wallet.cached_balance:
                    wallet.cached_balance = balance
                    wallet.balance_updated_at = timezone.now()
                    wallet.save()
                    updated += 1

            except Exception as e:
                self.stderr.write(f"Error syncing {wallet.address}: {e}")

        self.stdout.write(f"✅ Sincronizados {updated} wallets")
```

```bash
# Ejecutar manualmente
uv run python manage.py sync_balances

# En producción: correr cada 5 minutos via cron o Celery Beat
```

---

## Variables de entorno

```env
# Avalanche
AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
AVALANCHE_BACKEND_PRIVATE_KEY=0x...   # NUNCA commitear
PLR_TOKEN_ADDRESS=0x...
PLR_STAKING_ADDRESS=0x...

# Configuración de créditos
PLR_PRICE_ARS_PER_100=500
PLR_AI_IMAGE_COST=5
PLR_SUBSCRIPTION_CREDITS=200
PLR_SALE_REWARD_PERCENT=10
```
