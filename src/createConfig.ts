import type { Evaluate } from "@wagmi/core/internal"
import type { ExactPartial } from "@wagmi/core/internal"
import type { KernelAccountClient } from "@zerodev/sdk"
import type { EntryPoint } from "permissionless/types"
import type { Chain } from "viem"
import { persist, subscribeWithSelector } from "zustand/middleware"
import { createStore } from "zustand/vanilla"
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
    >
> = Evaluate<{
    chains: TChains
    projectIds: TProjectIds
    storage?: Storage | null | undefined
    ssr?: boolean | undefined
}>

export function createConfig<
    const TChains extends readonly [Chain, ...Chain[]],
    TProjectIds extends Record<TChains[number]["id"], string>
>(
    parameters: CreateConfigParameters<TChains, TProjectIds>
): Config<TChains, TProjectIds> {
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

    const clients = new Map<number, KernelAccountClient<EntryPoint>>()
    function getClient<chainId extends TChains[number]["id"]>(
        config: { chainId?: chainId | TChains[number]["id"] | undefined } = {}
    ): KernelAccountClient<EntryPoint> {
        const chainId = config.chainId ?? store.getState().chainId
        const chain = chains.getState().find((x) => x.id === chainId)

        if (config.chainId && !chain) throw new ZerodevNotConfiguredError()
        {
            const client = clients.get(store.getState().chainId)
            if (client && !chainId) return client
            else if (!chain) throw new ZerodevNotConfiguredError()
        }
        // If a memoized client exists for a chain id, use that.
        {
            const client = clients.get(chainId)
            if (client) return client
        }
        throw new KernelClientNotConnectedError()
    }

    function getInitialState() {
        return {
            chainId: chains.getState()[0].id,
            current: null
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
                      name: "zd_store",
                      partialize(state) {
                          // Only persist "critical" store properties to preserve storage size.
                          return {
                              chainId: state.chainId,
                              current: state.current
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
        }
    }
}

export type Config<
    TChains extends readonly [Chain, ...Chain[]] = readonly [Chain, ...Chain[]],
    TProjectIds extends Record<TChains[number]["id"], string> = Record<
        TChains[number]["id"],
        string
    >
> = {
    readonly chains: TChains
    readonly projectIds: TProjectIds
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
    }): KernelAccountClient<EntryPoint>
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
}

export type PartializedState = Evaluate<
    ExactPartial<Pick<State, "chainId" | "current">>
>
