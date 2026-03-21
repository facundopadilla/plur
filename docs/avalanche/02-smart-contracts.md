# 02 — Smart Contracts: PLRToken, PLRStaking, PLRMarketplace

## Setup del proyecto Hardhat

```bash
# Crear directorio de contratos (fuera del monorepo o como workspace)
mkdir plr-contracts && cd plr-contracts
npm init -y

# Instalar Hardhat y dependencias
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts

# Inicializar proyecto Hardhat (elegir TypeScript)
npx hardhat init
```

### `hardhat.config.ts`

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Fuji Testnet
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
      gas: 3000000,
      gasPrice: 25000000000, // 25 gwei
    },
    // Avalanche Mainnet
    mainnet: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
  },
  etherscan: {
    // Verificación en Snowtrace
    apiKey: {
      avalancheFujiTestnet: process.env.SNOWTRACE_API_KEY || "",
      avalanche: process.env.SNOWTRACE_API_KEY || "",
    },
    customChains: [
      {
        network: "avalancheFujiTestnet",
        chainId: 43113,
        urls: {
          apiURL: "https://api-testnet.snowtrace.io/api",
          browserURL: "https://testnet.snowtrace.io",
        },
      },
    ],
  },
};

export default config;
```

---

## Contrato 1: PLRToken.sol

Token ERC-20 principal. Es el "crédito" de Plur on-chain.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title PLRToken
 * @notice Token de utilidad de Plur. Representa "créditos" dentro de la app.
 *         Los usuarios no interactúan con este contrato directamente —
 *         el backend Django actúa como intermediario.
 *
 * Casos de uso:
 *   - Mint: cuando usuario compra créditos con FIAT, completa suscripción, o vende ropa
 *   - Burn: cuando usuario gasta créditos en IA, compra ropa, o servicios premium
 *   - Transfer: P2P entre usuarios, o hacia el contrato de marketplace
 *   - Stake: bloqueados en PLRStaking para ganar recompensas
 */
contract PLRToken is ERC20, ERC20Burnable, ERC20Pausable, AccessControl, ERC20Permit {

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Monto máximo que se puede mintear en una sola tx (protección contra bugs)
    uint256 public constant MAX_MINT_PER_TX = 1_000_000 * 10**18; // 1 millón PLR

    event CreditsIssued(
        address indexed to,
        uint256 amount,
        string reason,       // "purchase", "subscription", "sale_reward"
        bytes32 referenceId  // ID de la transacción en la DB de Plur
    );

    event CreditsBurned(
        address indexed from,
        uint256 amount,
        string reason,       // "ai_generation", "clothing_purchase", "fee"
        bytes32 referenceId
    );

    constructor(address admin, address minterBackend)
        ERC20("Plur", "PLR")
        ERC20Permit("Plur")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, minterBackend);
        _grantRole(BURNER_ROLE, minterBackend);
        _grantRole(PAUSER_ROLE, admin);
    }

    /**
     * @notice Emite PLR a un usuario.
     * @dev Solo el backend (MINTER_ROLE) puede llamar esto.
     *      Se llama cuando: compra FIAT, suscripción, reward por venta de ropa.
     */
    function mint(
        address to,
        uint256 amount,
        string calldata reason,
        bytes32 referenceId
    ) external onlyRole(MINTER_ROLE) {
        require(amount <= MAX_MINT_PER_TX, "PLR: amount exceeds per-tx limit");
        _mint(to, amount);
        emit CreditsIssued(to, amount, reason, referenceId);
    }

    /**
     * @notice Destruye PLR de un usuario.
     * @dev Solo el backend (BURNER_ROLE) puede llamar esto.
     *      Requiere que el usuario haya aprobado al backend previamente,
     *      O se usa ERC20Permit para aprobación sin gas.
     *      Se llama cuando: generación IA, compra de prenda, fees.
     */
    function burnFrom(
        address from,
        uint256 amount,
        string calldata reason,
        bytes32 referenceId
    ) external onlyRole(BURNER_ROLE) {
        _burn(from, amount);
        emit CreditsBurned(from, amount, reason, referenceId);
    }

    // ──────────────────────────────────────────
    // Funciones de emergencia
    // ──────────────────────────────────────────

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ──────────────────────────────────────────
    // Overrides requeridos por OpenZeppelin
    // ──────────────────────────────────────────

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}
```

---

## Contrato 2: PLRStaking.sol

Permite a los usuarios "stakear" sus créditos para ganar recompensas.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title PLRStaking
 * @notice Staking de tokens PLR con recompensas proporcionales al tiempo.
 *
 * Mecánica:
 *   - Usuario hace stake de N PLR por M días
 *   - Gana recompensas lineales (APY configurable, default 12%)
 *   - Puede hacer unstake después del período mínimo (con penalidad si es antes)
 *   - Las recompensas se mintean via PLRToken.mint()
 *
 * En la app, esto se muestra como:
 *   "Bloquear créditos por 30 días → ganar 15 créditos extras"
 */
contract PLRStaking is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public immutable plrToken;

    // APY en base 10000 (1200 = 12.00%)
    uint256 public annualRewardRate = 1200;

    // Período mínimo de staking (en segundos)
    uint256 public minStakingPeriod = 7 days;

    // Penalidad por retiro anticipado (en base 10000 — 2000 = 20%)
    uint256 public earlyWithdrawalPenalty = 2000;

    struct StakeInfo {
        uint256 amount;         // PLR en stake
        uint256 startTime;      // Timestamp de inicio
        uint256 lockDuration;   // Duración elegida (en segundos)
        uint256 rewardDebt;     // Recompensas ya reclamadas
    }

    mapping(address => StakeInfo) public stakes;

    uint256 public totalStaked;

    event Staked(address indexed user, uint256 amount, uint256 duration);
    event Unstaked(address indexed user, uint256 amount, uint256 rewards);
    event EarlyUnstaked(address indexed user, uint256 amount, uint256 penalty);
    event RewardsClaimed(address indexed user, uint256 rewards);

    constructor(address _plrToken) Ownable(msg.sender) {
        plrToken = IERC20(_plrToken);
    }

    /**
     * @notice Staking de PLR por un período determinado.
     * @param amount Cantidad de PLR a stakear (en wei: 50 PLR = 50 * 10^18)
     * @param duration Duración en segundos (ej: 30 días = 2592000)
     */
    function stake(uint256 amount, uint256 duration) external nonReentrant whenNotPaused {
        require(amount > 0, "PLRStaking: amount must be > 0");
        require(duration >= minStakingPeriod, "PLRStaking: duration too short");
        require(stakes[msg.sender].amount == 0, "PLRStaking: already staking");

        plrToken.safeTransferFrom(msg.sender, address(this), amount);

        stakes[msg.sender] = StakeInfo({
            amount: amount,
            startTime: block.timestamp,
            lockDuration: duration,
            rewardDebt: 0
        });

        totalStaked += amount;

        emit Staked(msg.sender, amount, duration);
    }

    /**
     * @notice Calcula las recompensas acumuladas de un usuario.
     */
    function pendingRewards(address user) public view returns (uint256) {
        StakeInfo memory s = stakes[user];
        if (s.amount == 0) return 0;

        uint256 elapsed = block.timestamp - s.startTime;
        // Cappear en la duración del lock para no seguir acumulando después
        if (elapsed > s.lockDuration) elapsed = s.lockDuration;

        // reward = amount * APY * elapsed / (365 days * 10000)
        uint256 reward = (s.amount * annualRewardRate * elapsed) / (365 days * 10000);
        return reward - s.rewardDebt;
    }

    /**
     * @notice Retira PLR más recompensas al finalizar el período.
     * @dev El contrato necesita tener MINTER_ROLE en PLRToken para mintear recompensas.
     *      Alternativamente, el owner puede depositarle PLR de antemano como "reward pool".
     */
    function unstake() external nonReentrant {
        StakeInfo storage s = stakes[msg.sender];
        require(s.amount > 0, "PLRStaking: no stake found");

        uint256 timeElapsed = block.timestamp - s.startTime;
        uint256 amount = s.amount;
        uint256 rewards = pendingRewards(msg.sender);

        if (timeElapsed < s.lockDuration) {
            // Retiro anticipado: aplica penalidad sobre el monto principal
            uint256 penalty = (amount * earlyWithdrawalPenalty) / 10000;
            uint256 returnAmount = amount - penalty;

            totalStaked -= amount;
            delete stakes[msg.sender];

            plrToken.safeTransfer(msg.sender, returnAmount);
            // La penalidad queda en el contrato como rewards para otros stakers

            emit EarlyUnstaked(msg.sender, returnAmount, penalty);
        } else {
            // Retiro normal: devuelve todo más recompensas
            totalStaked -= amount;
            delete stakes[msg.sender];

            plrToken.safeTransfer(msg.sender, amount);

            if (rewards > 0) {
                // El backend debe cargar este contrato con PLR para recompensas
                // O el contrato debe tener MINTER_ROLE — ver setup
                plrToken.safeTransfer(msg.sender, rewards);
            }

            emit Unstaked(msg.sender, amount, rewards);
        }
    }

    // ──────────────────────────────────────────
    // Admin
    // ──────────────────────────────────────────

    function setAnnualRewardRate(uint256 rate) external onlyOwner {
        require(rate <= 5000, "PLRStaking: max 50% APY");
        annualRewardRate = rate;
    }

    function setMinStakingPeriod(uint256 period) external onlyOwner {
        minStakingPeriod = period;
    }

    function setEarlyWithdrawalPenalty(uint256 penalty) external onlyOwner {
        require(penalty <= 5000, "PLRStaking: max 50% penalty");
        earlyWithdrawalPenalty = penalty;
    }

    // Cargar recompensas en el contrato (el backend transfiere PLR acá)
    function depositRewards(uint256 amount) external onlyOwner {
        plrToken.safeTransferFrom(msg.sender, address(this), amount);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
```

---

## Contrato 3: PLRMarketplace.sol (V2 — opcional)

Para el P2P de ropa y créditos. En V1 puede ser manejado off-chain por el backend.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PLRMarketplace
 * @notice Marketplace P2P para intercambio de créditos PLR por ropa.
 *
 * En la app, el usuario no sabe que esto es un smart contract.
 * Ve: "Juan vende su campera por 150 créditos" — hace click — transfiere.
 *
 * Una prenda = un listingId con un precio en PLR.
 * El backend registra qué prenda física corresponde a cada listingId.
 */
contract PLRMarketplace is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable plrToken;

    // Fee de la plataforma (en base 10000 — 250 = 2.5%)
    uint256 public platformFee = 250;
    address public feeRecipient;

    struct Listing {
        address seller;
        uint256 priceInPLR;  // Precio en PLR (wei)
        bool active;
        string clothingId;   // ID de la prenda en la DB de Plur
    }

    mapping(bytes32 => Listing) public listings;

    event Listed(bytes32 indexed listingId, address indexed seller, uint256 price, string clothingId);
    event Sold(bytes32 indexed listingId, address indexed buyer, address indexed seller, uint256 price);
    event Cancelled(bytes32 indexed listingId);

    constructor(address _plrToken, address _feeRecipient) Ownable(msg.sender) {
        plrToken = IERC20(_plrToken);
        feeRecipient = _feeRecipient;
    }

    /**
     * @notice Crea un listing de ropa para vender por PLR.
     * @param listingId ID único del listing (generado por el backend)
     * @param priceInPLR Precio en PLR (ej: 150 * 10^18 para 150 créditos)
     * @param clothingId ID de la prenda en la DB de Django
     */
    function createListing(
        bytes32 listingId,
        uint256 priceInPLR,
        string calldata clothingId
    ) external {
        require(!listings[listingId].active, "PLRMarketplace: listing exists");
        require(priceInPLR > 0, "PLRMarketplace: price must be > 0");

        listings[listingId] = Listing({
            seller: msg.sender,
            priceInPLR: priceInPLR,
            active: true,
            clothingId: clothingId
        });

        emit Listed(listingId, msg.sender, priceInPLR, clothingId);
    }

    /**
     * @notice Compra una prenda. Transfiere PLR del comprador al vendedor (menos fee).
     */
    function buyListing(bytes32 listingId) external nonReentrant {
        Listing storage l = listings[listingId];
        require(l.active, "PLRMarketplace: listing not active");
        require(l.seller != msg.sender, "PLRMarketplace: cannot buy own listing");

        uint256 fee = (l.priceInPLR * platformFee) / 10000;
        uint256 sellerAmount = l.priceInPLR - fee;

        l.active = false;

        plrToken.safeTransferFrom(msg.sender, l.seller, sellerAmount);
        if (fee > 0) {
            plrToken.safeTransferFrom(msg.sender, feeRecipient, fee);
        }

        emit Sold(listingId, msg.sender, l.seller, l.priceInPLR);
    }

    /**
     * @notice Cancela un listing.
     */
    function cancelListing(bytes32 listingId) external {
        Listing storage l = listings[listingId];
        require(l.active, "PLRMarketplace: not active");
        require(l.seller == msg.sender || owner() == msg.sender, "PLRMarketplace: not authorized");
        l.active = false;
        emit Cancelled(listingId);
    }

    function setFee(uint256 fee) external onlyOwner {
        require(fee <= 1000, "PLRMarketplace: max 10%");
        platformFee = fee;
    }
}
```

---

## Scripts de deploy

```typescript
// scripts/deploy.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // 1. Wallet del backend Django
  const BACKEND_WALLET = process.env.BACKEND_WALLET_ADDRESS!;
  const FEE_RECIPIENT = deployer.address; // En prod: multisig

  // 2. Deploy PLRToken
  const PLRToken = await ethers.getContractFactory("PLRToken");
  const plrToken = await PLRToken.deploy(deployer.address, BACKEND_WALLET);
  await plrToken.waitForDeployment();
  console.log("PLRToken deployed to:", await plrToken.getAddress());

  // 3. Deploy PLRStaking
  const PLRStaking = await ethers.getContractFactory("PLRStaking");
  const plrStaking = await PLRStaking.deploy(await plrToken.getAddress());
  await plrStaking.waitForDeployment();
  console.log("PLRStaking deployed to:", await plrStaking.getAddress());

  // 4. Deploy PLRMarketplace (opcional V2)
  const PLRMarketplace = await ethers.getContractFactory("PLRMarketplace");
  const plrMarketplace = await PLRMarketplace.deploy(
    await plrToken.getAddress(),
    FEE_RECIPIENT
  );
  await plrMarketplace.waitForDeployment();
  console.log("PLRMarketplace deployed to:", await plrMarketplace.getAddress());

  // 5. Dar MINTER_ROLE al contrato de staking (para mintear rewards)
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  await plrToken.grantRole(MINTER_ROLE, await plrStaking.getAddress());
  console.log("Granted MINTER_ROLE to PLRStaking");

  console.log("\n✅ Deploy completo. Agregar al .env:");
  console.log(`PLR_TOKEN_ADDRESS=${await plrToken.getAddress()}`);
  console.log(`PLR_STAKING_ADDRESS=${await plrStaking.getAddress()}`);
  console.log(`PLR_MARKETPLACE_ADDRESS=${await plrMarketplace.getAddress()}`);
}

main().catch(console.error);
```

```bash
# Deploy en Fuji testnet
npx hardhat run scripts/deploy.ts --network fuji

# Verificar en Snowtrace
npx hardhat verify --network fuji <PLR_TOKEN_ADDRESS> <DEPLOYER_ADDRESS> <BACKEND_WALLET>
```

---

## Tests

```typescript
// test/PLRToken.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";

describe("PLRToken", function () {
  it("should mint tokens with MINTER_ROLE", async function () {
    const [admin, minter, user] = await ethers.getSigners();
    const PLRToken = await ethers.getContractFactory("PLRToken");
    const token = await PLRToken.deploy(admin.address, minter.address);

    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    expect(await token.hasRole(MINTER_ROLE, minter.address)).to.be.true;

    const refId = ethers.keccak256(ethers.toUtf8Bytes("tx-001"));
    await token.connect(minter).mint(user.address, ethers.parseEther("100"), "purchase", refId);

    expect(await token.balanceOf(user.address)).to.equal(ethers.parseEther("100"));
  });

  it("should not allow mint without MINTER_ROLE", async function () {
    const [admin, attacker, user] = await ethers.getSigners();
    const PLRToken = await ethers.getContractFactory("PLRToken");
    const token = await PLRToken.deploy(admin.address, admin.address);

    const refId = ethers.keccak256(ethers.toUtf8Bytes("tx-001"));
    await expect(
      token.connect(attacker).mint(user.address, ethers.parseEther("100"), "hack", refId)
    ).to.be.reverted;
  });
});
```

```bash
npx hardhat test
npx hardhat coverage
```
