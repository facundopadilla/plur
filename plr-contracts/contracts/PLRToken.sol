// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title PLRToken
 * @notice Utility token for Plur. Represents "credits" within the app.
 *         Users never interact with this contract directly —
 *         the Django backend acts as the custodial intermediary.
 *
 * Mint: when user purchases credits with FIAT, completes subscription, or sells clothes.
 * Burn: when user spends credits on AI generation, clothing purchase, or premium services.
 * Transfer: P2P between users.
 *
 * @dev Custodial model: MINTER_ROLE mints, BURNER_ROLE burns without requiring
 *      token holder approval. No ERC20 allowance needed for burning.
 */
contract PLRToken is ERC20, ERC20Pausable, AccessControl, ERC20Permit {

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public constant MAX_MINT_PER_TX = 1_000_000 * 10**18;

    mapping(bytes32 => bool) private _usedReferenceIds;

    event CreditsIssued(
        address indexed to,
        uint256 amount,
        string reason,
        bytes32 referenceId
    );

    event CreditsBurned(
        address indexed from,
        uint256 amount,
        string reason,
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

    function mint(
        address to,
        uint256 amount,
        string calldata reason,
        bytes32 referenceId
    ) external onlyRole(MINTER_ROLE) {
        require(amount <= MAX_MINT_PER_TX, "PLR: amount exceeds per-tx limit");
        require(!_usedReferenceIds[referenceId], "PLR: referenceId already used");
        _usedReferenceIds[referenceId] = true;
        _mint(to, amount);
        emit CreditsIssued(to, amount, reason, referenceId);
    }

    /**
     * @dev Custodial burn: BURNER_ROLE can burn without allowance. No approval required.
     *      This is intentionally different from ERC20Burnable.burnFrom() which checks allowance.
     */
    function burnFrom(
        address from,
        uint256 amount,
        string calldata reason,
        bytes32 referenceId
    ) external onlyRole(BURNER_ROLE) {
        require(!_usedReferenceIds[referenceId], "PLR: referenceId already used");
        _usedReferenceIds[referenceId] = true;
        _burn(from, amount);
        emit CreditsBurned(from, amount, reason, referenceId);
    }

    function isReferenceIdUsed(bytes32 referenceId) external view returns (bool) {
        return _usedReferenceIds[referenceId];
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}
