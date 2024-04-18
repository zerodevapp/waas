export const WC_PROJECT_ID = 'bb1805e49e8bd78a9c75aefed3649d68';

export const ZERO_DEV_WALLET_METADATA = {
  name: 'ZeroDev Wallet',
  url: 'https://zerodev.app',
  description: 'Smart contract wallet for Ethereum',
  icons: ['https://pbs.twimg.com/profile_images/1582474288719880195/DavMgC0t_400x400.jpg'], // TODO: add icon
}

export const EIP155 = 'eip155' as const

export const KERNEL_COMPATIBLE_METHODS = [
  'eth_accounts',
  'eth_chainId',
  'personal_sign',
  'eth_sign',
  'eth_signTypedData',
  'eth_signTypedData_v4',
  'eth_sendTransaction',
  'eth_blockNumber',
  'eth_getBalance',
  'eth_getCode',
  'eth_getTransactionCount',
  'eth_getStorageAt',
  'eth_getBlockByNumber',
  'eth_getBlockByHash',
  'eth_getTransactionByHash',
  'eth_getTransactionReceipt',
  'eth_estimateGas',
  'eth_call',
  'eth_getLogs',
  'eth_gasPrice',
]

export const KERNEL_COMPATIBLE_EVENTS = ['chainChanged', 'accountsChanged']

export const stripEip155Prefix = (eip155Address: string): string => {
  return eip155Address.split(':').pop() ?? ''
}