import type { TokenSymbolsMap, gasTokenAddresses } from "@zerodev/sdk"

export type PaymasterType = "SPONSOR" | "ERC20"

export type PaymasterERC20 = {
    type: "ERC20"
    gasToken: TokenSymbolsMap[keyof TokenSymbolsMap] // Required for ERC20
}

export type PaymasterSPONSOR = {
    type: "SPONSOR"
    gasToken?: TokenSymbolsMap[keyof TokenSymbolsMap] // Optional for SPONSOR
}

export type GasTokenChainIdType = keyof typeof gasTokenAddresses

export type GasTokenType = keyof (typeof gasTokenAddresses)[GasTokenChainIdType]
