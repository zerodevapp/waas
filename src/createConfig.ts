import type { Evaluate } from "@wagmi/core/internal"
import type { ExactPartial } from "@wagmi/core/internal"
import type {
    KernelAccountClient,
    KernelSmartAccount,
    KernelValidator
} from "@zerodev/sdk"
import type { EntryPoint } from "permissionless/types"
import type { Chain, Client, PublicClient, Transport } from "viem"
import { createPublicClient } from "viem"
import { persist, subscribeWithSelector } from "zustand/middleware"
import { type Mutate, type StoreApi, createStore } from "zustand/vanilla"
import {
    KernelClientNotConnectedError,
    ZerodevNotConfiguredError
} from "./errors"
import { version } from "./utils/config"
import {
    type Storage,
    createStorage,
    noopStorage
} from "./utils/config/createStorage"

export type CreateConfigParameters<
    TChains extends readonly [Chain, ...Chain[]] = readonly [Chain, ...Chain[]],
    TProjectIds extends Record<TChains[number]["id"], string> = Record<
        TChains[number]["id"],
        string
    >,
    TTransports extends Record<TChains[number]["id"], Transport> = Record<
        TChains[number]["id"],
        Transport
    >
> = Evaluate<{
    chains: TChains
    projectIds: TProjectIds
    transports: TTransports
    storage?: Storage | null | undefined
    ssr?: boolean | undefined
}>

export function createConfig<
    const TChains extends readonly [Chain, ...Chain[]],
    TProjectIds extends Record<TChains[number]["id"], string>,
    TTransports extends Record<TChains[number]["id"], Transport> = Record<
        TChains[number]["id"],
        Transport
    >
>(
    parameters: CreateConfigParameters<TChains, TProjectIds, TTransports>
): Config<TChains, TProjectIds, TTransports> {
    const {
        storage = createStorage({
            key: "zerodev",
            storage:
                typeof window !== "undefined" && window.localStorage
                    ? window.localStorage
                    : noopStorage
        }),
        ssr,
        ...rest
    } = parameters

    const chains = createStore(() => rest.chains)
    const projectIds = createStore(() => rest.projectIds)
    const transports = createStore(() => rest.transports)

    const clients = new Map<number, Client<Transport, TChains[number]>>()
    function getClient<TChainId extends TChains[number]["id"]>(
        config: { chainId?: TChainId | TChains[number]["id"] | undefined } = {}
    ): PublicClient {
        const chainId = config.chainId ?? store.getState().chainId
        const chain = chains.getState().find((x) => x.id === chainId)

        // chainId specified and not configured
        if (config.chainId && !chain) throw new ZerodevNotConfiguredError()

        // If the target chain is not configured, use the client of the current chain.
        type Return = PublicClient
        {
            const client = clients.get(store.getState().chainId)
            if (client && !chain) return client as Return
            else if (!chain) throw new ZerodevNotConfiguredError()
        }

        // If a memoized client exists for a chain id, use that.
        {
            const client = clients.get(chainId)
            if (client) return client as Return
        }

        const client = createPublicClient({
            chain,
            transport: rest.transports[chainId as TChainId]
        })

        clients.set(chainId, client)
        return client as Return
    }

    function getInitialState() {
        return {
            chainId: chains.getState()[0].id,
            current: null,
            connections: new Map()
        } satisfies State
    }

    let currentVersion: number
    const prefix = "0.0.0-canary-"
    if (version.startsWith(prefix))
        currentVersion = Number.parseInt(version.replace(prefix, ""))
    else currentVersion = Number.parseInt(version.split(".")[0] ?? "0")

    const store = createStore(
        subscribeWithSelector(
            // only use persist middleware if storage exists
            storage
                ? persist(getInitialState, {
                      migrate(persistedState, version) {
                          if (version === currentVersion)
                              return persistedState as State

                          const initialState = getInitialState()
                          const chainId =
                              persistedState &&
                              typeof persistedState === "object" &&
                              "chainId" in persistedState &&
                              typeof persistedState.chainId === "number"
                                  ? persistedState.chainId
                                  : initialState.chainId
                          return { ...initialState, chainId }
                      },
                      name: "store",
                      partialize(state) {
                          // Only persist "critical" store properties to preserve storage size.
                          return {
                              chainId: state.chainId,
                              current: state.current,
                              connections: state.connections
                          } satisfies PartializedState
                      },
                      skipHydration: ssr,
                      storage: storage as Storage<Record<string, unknown>>,
                      version: currentVersion
                  })
                : getInitialState
        )
    )

    return {
        get chains() {
            return chains.getState() as TChains
        },
        get projectIds() {
            return projectIds.getState() as TProjectIds
        },
        get transports() {
            return transports.getState() as TTransports
        },
        storage,

        getClient,
        get state() {
            return store.getState() as unknown as State<TChains>
        },
        setState(value) {
            let newState: State
            if (typeof value === "function")
                newState = value(store.getState() as any)
            else newState = value

            // Reset state if it got set to something not matching the base state
            const initialState = getInitialState()
            if (typeof newState !== "object") newState = initialState
            const isCorrupt = Object.keys(initialState).some(
                (x) => !(x in newState)
            )
            if (isCorrupt) newState = initialState

            store.setState(newState, true)
        },
        subscribe(selector, listener, options) {
            return store.subscribe(
                selector as unknown as (state: State) => any,
                listener,
                options
                    ? { ...options, fireImmediately: options.emitImmediately }
                    : undefined
            )
        },
        _internal: {
            store,
            ssr: Boolean(ssr),
            chains: {
                setState(value) {
                    const nextChains = (
                        typeof value === "function"
                            ? value(chains.getState())
                            : value
                    ) as TChains
                    if (nextChains.length === 0) return
                    return chains.setState(nextChains, true)
                },
                subscribe(listener) {
                    return chains.subscribe(listener)
                }
            }
        }
    }
}

export type Config<
    TChains extends readonly [Chain, ...Chain[]] = readonly [Chain, ...Chain[]],
    TProjectIds extends Record<TChains[number]["id"], string> = Record<
        TChains[number]["id"],
        string
    >,
    TTransports extends Record<TChains[number]["id"], Transport> = Record<
        TChains[number]["id"],
        Transport
    >
> = {
    readonly chains: TChains
    readonly projectIds: TProjectIds
    readonly transports: TTransports
    readonly storage: Storage | null

    readonly state: State<TChains>
    setState<tchains extends readonly [Chain, ...Chain[]] = TChains>(
        value: State<tchains> | ((state: State<tchains>) => State<tchains>)
    ): void
    subscribe<state>(
        selector: (state: State<TChains>) => state,
        listener: (state: state, previousState: state) => void,
        options?:
            | {
                  emitImmediately?: boolean | undefined
                  equalityFn?: ((a: state, b: state) => boolean) | undefined
              }
            | undefined
    ): () => void

    getClient<chainId extends TChains[number]["id"]>(parameters?: {
        chainId?: chainId | TChains[number]["id"] | undefined
    }): PublicClient

    _internal: {
        readonly store: Mutate<StoreApi<any>, [["zustand/persist", any]]>
        readonly ssr: boolean

        chains: {
            setState(
                value:
                    | readonly [Chain, ...Chain[]]
                    | ((
                          state: readonly [Chain, ...Chain[]]
                      ) => readonly [Chain, ...Chain[]])
            ): void
            subscribe(
                listener: (
                    state: readonly [Chain, ...Chain[]],
                    prevState: readonly [Chain, ...Chain[]]
                ) => void
            ): () => void
        }
    }
}

export type PaymasterType = "SPONSOR" | "ERC20" | "NO"
export type CurrentClient = {
    uid: string
    paymaster: PaymasterType
}

export type State<
    TChains extends readonly [Chain, ...Chain[]] = readonly [Chain, ...Chain[]]
> = {
    chainId: TChains[number]["id"]
    current: string | null
    connections: Map<string, Connection>
}

export type KernelClient = {
    client: KernelAccountClient<EntryPoint> | null
    account: KernelSmartAccount<EntryPoint>
    entryPoint: EntryPoint
    validator: KernelValidator<EntryPoint>
}

export type Connection = {
    accounts: readonly [KernelClient, ...KernelClient[]]
    chainId: number
}

export type PartializedState = Evaluate<
    ExactPartial<Pick<State, "chainId" | "current" | "connections">>
>
