"""Avalanche C-Chain blockchain integration for PLR token operations."""

from __future__ import annotations

from typing import TYPE_CHECKING

from django.conf import settings
from eth_account import Account
from loguru import logger
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

if TYPE_CHECKING:
    from eth_account.signers.local import LocalAccount
    from web3.contract import Contract

# Minimal ABI for PLRToken — only the functions we call
PLR_TOKEN_ABI = [
    {
        "inputs": [
            {"name": "to", "type": "address"},
            {"name": "amount", "type": "uint256"},
            {"name": "reason", "type": "string"},
            {"name": "referenceId", "type": "bytes32"},
        ],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {"name": "from", "type": "address"},
            {"name": "amount", "type": "uint256"},
            {"name": "reason", "type": "string"},
            {"name": "referenceId", "type": "bytes32"},
        ],
        "name": "burnFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
]

FUJI_CHAIN_ID = 43113


def get_web3() -> Web3:
    """Return a Web3 instance connected to Avalanche C-Chain.

    Returns:
        Connected Web3 instance with POA middleware for Fuji testnet.

    Raises:
        ConnectionError: If the RPC endpoint is unreachable.
    """
    w3 = Web3(Web3.HTTPProvider(settings.AVALANCHE_RPC_URL))
    w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
    if not w3.is_connected():
        raise ConnectionError(f"Cannot connect to Avalanche RPC: {settings.AVALANCHE_RPC_URL}")
    return w3


def get_plr_contract(w3: Web3) -> Contract:
    """Return the PLRToken contract instance.

    Args:
        w3: Connected Web3 instance.

    Returns:
        Contract instance bound to the PLR token address.
    """
    return w3.eth.contract(
        address=Web3.to_checksum_address(settings.PLR_TOKEN_ADDRESS),
        abi=PLR_TOKEN_ABI,
    )


def get_backend_account() -> LocalAccount:
    """Load the backend signing account from the private key in settings.

    Returns:
        LocalAccount instance for transaction signing.

    Raises:
        ValueError: If the private key is not configured.
    """
    pk = settings.AVALANCHE_BACKEND_PRIVATE_KEY
    if not pk:
        raise ValueError("AVALANCHE_BACKEND_PRIVATE_KEY is not configured")
    return Account.from_key(pk)


def mint_plr(amount_plr: int, reason: str, reference_id_str: str, to_address: str = "") -> str:
    """Mint PLR tokens to a wallet address on-chain.

    Args:
        amount_plr: Amount in whole PLR units (not wei).
        reason: Human-readable reason stored in the on-chain event.
        reference_id_str: Unique reference string (hashed to bytes32 for idempotency).
        to_address: Target wallet address. Defaults to backend treasury wallet.

    Returns:
        Transaction hash as hex string (e.g. '0xabc...').

    Raises:
        Exception: If the transaction fails or times out.
    """
    w3 = get_web3()
    contract = get_plr_contract(w3)
    account = get_backend_account()

    target = Web3.to_checksum_address(to_address) if to_address else account.address
    amount_wei = Web3.to_wei(amount_plr, "ether")
    ref_id = Web3.keccak(text=reference_id_str)

    nonce = w3.eth.get_transaction_count(account.address)
    tx = contract.functions.mint(
        target,
        amount_wei,
        reason,
        ref_id,
    ).build_transaction(
        {
            "from": account.address,
            "nonce": nonce,
            "gas": 300_000,
            "gasPrice": w3.eth.gas_price,
            "chainId": FUJI_CHAIN_ID,
        }
    )

    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)

    if receipt["status"] != 1:
        raise Exception(f"Mint transaction failed: {tx_hash.hex()}")

    hex_hash = "0x" + tx_hash.hex()
    logger.info(
        "PLR minted on-chain",
        to=target,
        amount=amount_plr,
        reason=reason,
        tx_hash=hex_hash,
    )
    return hex_hash


def burn_plr(amount_plr: int, reason: str, reference_id_str: str, from_address: str = "") -> str:
    """Burn PLR tokens from a wallet address on-chain.

    Args:
        amount_plr: Amount in whole PLR units (not wei).
        reason: Human-readable reason stored in the on-chain event.
        reference_id_str: Unique reference string (hashed to bytes32 for idempotency).
        from_address: Wallet to burn from. Defaults to backend treasury wallet.

    Returns:
        Transaction hash as hex string.

    Raises:
        Exception: If the transaction fails or times out.
    """
    w3 = get_web3()
    contract = get_plr_contract(w3)
    account = get_backend_account()

    target = Web3.to_checksum_address(from_address) if from_address else account.address
    amount_wei = Web3.to_wei(amount_plr, "ether")
    ref_id = Web3.keccak(text=reference_id_str)

    nonce = w3.eth.get_transaction_count(account.address)
    tx = contract.functions.burnFrom(
        target,
        amount_wei,
        reason,
        ref_id,
    ).build_transaction(
        {
            "from": account.address,
            "nonce": nonce,
            "gas": 300_000,
            "gasPrice": w3.eth.gas_price,
            "chainId": FUJI_CHAIN_ID,
        }
    )

    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)

    if receipt["status"] != 1:
        raise Exception(f"Burn transaction failed: {tx_hash.hex()}")

    hex_hash = "0x" + tx_hash.hex()
    logger.info(
        "PLR burned on-chain",
        from_addr=target,
        amount=amount_plr,
        reason=reason,
        tx_hash=hex_hash,
    )
    return hex_hash


def get_plr_balance(address: str) -> int:
    """Read the PLR token balance for an address from the blockchain.

    Args:
        address: Ethereum address to query.

    Returns:
        Balance in whole PLR units (not wei).
    """
    w3 = get_web3()
    contract = get_plr_contract(w3)
    balance_wei = contract.functions.balanceOf(Web3.to_checksum_address(address)).call()
    return int(Web3.from_wei(balance_wei, "ether"))
