import {
    type Address,
    ContractFunctionExecutionError,
    type ContractFunctionExecutionErrorType,
    type Hex,
    type PublicClient,
    formatUnits,
    hexToString,
    trim
} from "viem"
import {
    KernelClientNotConnectedError,
    type KernelClientNotConnectedErrorType
} from "../errors"

export type GetBalanceParameters = {
    symbolType: "string" | "bytes32"
    address: Address
    tokenAddress: Address
}

export type GetBalanceReturnType = {
    value: bigint
    decimals: number
    symbol: string
    formatted: string
}

export type GetBalanceErrorType =
    | KernelClientNotConnectedErrorType
    | ContractFunctionExecutionErrorType

export async function getBalance(
    publicClient: PublicClient,
    parameters: GetBalanceParameters
): Promise<GetBalanceReturnType> {
    const { address, tokenAddress } = parameters
    const chain = publicClient.chain

    if (!chain) {
        throw new KernelClientNotConnectedError()
    }
    if (tokenAddress) {
        try {
            return await getTokenBalance(publicClient, {
                address: address,
                symbolType: "string",
                tokenAddress
            })
        } catch (error) {
            // In the chance that there is an error upon decoding the contract result,
            // it could be likely that the contract data is represented as bytes32 instead
            // of a string.
            if (error instanceof ContractFunctionExecutionError) {
                const balance = await getTokenBalance(publicClient, {
                    address: address,
                    symbolType: "bytes32",
                    tokenAddress
                })
                const symbol = hexToString(
                    trim(balance.symbol as Hex, { dir: "right" })
                )
                return { ...balance, symbol }
            }
            throw error
        }
    }
    const balance = await publicClient.getBalance({
        address: address
    })

    return {
        value: balance,
        decimals: chain.nativeCurrency.decimals,
        symbol: chain.nativeCurrency.symbol,
        formatted: formatUnits(balance, chain.nativeCurrency.decimals)
    }
}

async function getTokenBalance(
    publicClient: PublicClient,
    parameters: GetBalanceParameters
): Promise<GetBalanceReturnType> {
    const { tokenAddress, address, symbolType } = parameters
    const contract = {
        abi: [
            {
                type: "function",
                name: "balanceOf",
                stateMutability: "view",
                inputs: [{ type: "address" }],
                outputs: [{ type: "uint256" }]
            },
            {
                type: "function",
                name: "decimals",
                stateMutability: "view",
                inputs: [],
                outputs: [{ type: "uint8" }]
            },
            {
                type: "function",
                name: "symbol",
                stateMutability: "view",
                inputs: [],
                outputs: [{ type: symbolType }]
            }
        ],
        address: tokenAddress
    }

    const [value, decimals, symbol] = await Promise.all(
        [
            {
                ...contract,
                functionName: "balanceOf",
                args: [address]
            },
            { ...contract, functionName: "decimals" },
            { ...contract, functionName: "symbol" }
        ].map((contract) => publicClient.readContract(contract))
    )
    const formatted = formatUnits(value as bigint, decimals as number)

    return {
        decimals: decimals as number,
        formatted,
        symbol: symbol as string,
        value: value as bigint
    }
}
