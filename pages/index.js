import Head from "next/head";
import styles from "../styles/Home.module.css";
import Web3Modal from "web3modal";
import { providers, Contract } from "ethers";
import { useEffect, useRef, useState } from "react";
import { WHITELIST_CONTRACT_ADDRESS, abi } from "../constants/index";

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [joinedWhitelist, setJoinedWhitelist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(0);
  const web3ModalRef = useRef();
  /**
   * Returns a Provider or Signer object representing the Ethereum RPC with or without the
   * signing capabilities of metamask attached
   *
   * A `Provider` is needed to interact with the blockchain - reading transactions, reading balances, reading state, etc.
   *
   * A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain, which involves the connected account
   * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API to allow your website to
   * request signatures from the user using Signer functions.
   *
   * @param {*} needSigner - True if you need the signer, default false otherwise
   */

  // this one will help us to connect with MetaMaks and read value
  const getProviderOrSigner = async (needSigner = false) => {
    // connect to metamask
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // we are making this one for rinkeby test network only, so if user is not connected to rinkeby test network, it will throw an error.
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Please change your network to Rinkeby.");
      throw new Error("Change your network to Rinkeby.");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  // add address to whitelist
  const addAddressToWhitelist = async () => {
    try {
      const signer = await getProviderOrSigner(true); // sending true as we need signer
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      );

      const tx = await whitelistContract.addAddressToWhitelist();
      setLoading(true);
      await tx.wait();
      setLoading(false);

      await getNumberOfWhitelisted();
      setJoinedWhitelist(true);
    } catch (error) {
      console.log(error);
    }
  };

  // this function will get total number of whitelisted addresses
  // to display to user
  const getNumberOfWhitelisted = async () => {
    try {
      // using provider here because we are just reading data from the blockchain
      // if we wanted to write some data we would have used signer
      const provider = await getProviderOrSigner();

      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        provider
      );

      const _numberOfWhitelisted =
        await whitelistContract.numAddressesWhitelisted();
      setNumberOfWhitelisted(_numberOfWhitelisted);
    } catch (error) {
      console.log(error);
    }
  };

  // checking if address is already in whitelist
  const checkIfAddressInWhitelist = async () => {
    try {
      // this will need signer as it may write data on blockchain to add address in whitelist
      const signer = getProviderOrSigner(true);
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      );

      const address = await signer.getAddress();
      const _joinedWhitelist = await whitelistContract.whitelistedAddresses(
        address
      );

      // here we are writing data on blockchain
      setJoinedWhitelist(_joinedWhitelist);
    } catch (error) {
      console.log(error);
    }
  };

  // connect your walled from here
  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);

      checkIfAddressInWhitelist();
      getNumberOfWhitelisted();
    } catch (error) {
      console.log(error);
    }
  };

  // rendering value of button based on scenarios
  const renderButton = () => {
    if (walletConnected) {
      if (checkIfAddressInWhitelist) {
        return (
          <div className={styles.description}>
            Thanks for joining the Whitelist!
          </div>
        );
      } else if (loading) {
        return <button className={styles.button}>Loading...</button>;
      } else {
        return (
          <button onClick={addAddressToWhitelist} className={styles.button}>
            Join the Whitelist
          </button>
        );
      }
    } else {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }
  };

  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
    }
  }, [walletConnected]);

  return (
    <div>
      <Head>
        <title>Whitelist Dapp</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {numberOfWhitelisted} have already joined the Whitelist
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./crypto-devs.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}
