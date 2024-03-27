# Setup
To use the hook in your component:

1. Import useWalletConnect:
```javascript
import useWalletConnect from '...'
```

2. Initialize the hook by passing the required parameters: chainId, address, and kernelClient:
```javascript
const {
  connect,
  proposal,
  onApprove,
  onReject,
  isLoading,
  disconnect
} = useWalletConnect({
  kernelClient,
});
```

## Features
### Connecting to a Wallet
To initiate a connection with a wallet, call the connect function with the WalletConnect URI:

```javascript
connect("YourWalletConnectUri");
```

### Handling Session Proposals
When a session proposal is received, the hook updates the proposal state. You can display this proposal to the user and allow them to approve or reject it:

```javascript
{proposal && (
  <>
    <button onClick={() => onApprove(proposal)}>Approve</button>
    <button onClick={() => onReject()}>Reject</button>
  </>
)}
```

### Disconnecting
To disconnect an existing session, use the disconnect function with the session object:

```javascript
disconnect(session);
```

## Example Usage
Below is an example of how you might use useWalletConnect within a component:

```javascript
function WalletConnectComponent() {
  const [account, setAccount] = useState();
  const [uri, setUri] = useState('');

  const { connect, proposal, onApprove, onReject } = useWalletConnect({
    chainId: account?.chain.id,
    address: account?.account.address,
    kernelClient: account
  });

  return (
    <div>
      <input value={uri} onChange={(e) => setUri(e.target.value)} />
      <button onClick={() => connect(uri)}>Connect</button>
      {proposal && (
        <>
          <button onClick={() => onApprove(proposal)}>Approve</button>
          <button onClick={() => onReject()}>Reject</button>
        </>
      )}
    </div>
  );
}
```