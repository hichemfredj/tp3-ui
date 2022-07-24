import React, { useEffect, useState } from "react"

// Librairie qui va nous permettre de communiquer avec notre contrat
import { ethers } from "ethers"

import './App.css';

// https://docs.soliditylang.org/en/v0.8.14/abi-spec.html?
import abi from "./utils/IftOpinion.json";


const App = () =>  {

  // storer le wallet de l'utilisateur
  const [currentAccount, setCurrentAccount] = useState("");

  const [allPosts, setAllPosts] = useState([]);
  
  const [inputData, setInputData] = useState("");

  const [ loading, setLoading ] = useState(false);

  // adresse de notre contrat deployé
  const contractAddress = "0xdc4bD2edD5e818F5D052adbE4089C42E6736d113";

  /*  
  * Lorsque on compile notre contrat, le compilateur genere des fichiers qui nous permettent d'interagir avec le contrat. 
  * les fichiers se trouve dans le dossier artefacts situé à la racine du projet Solidity.
  * on copie le contenue du fichier json et on le ramene dans projet front-end dans "/src/utils/IftOpinion.json
  */
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Veuillez telecharger l'application Metamask!")
        return;
      } else {
        console.log("L'objet ethereum a été detecté", ethereum);
      }

      /*
        Check si on est autoriser a acceder au wallet de l'utilisateur
      */
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("compte autoriser trouvé!", account);
        setCurrentAccount(account);
        getAllPosts();
      } else {
        console.log("Aucun compte autoriser n'a été trouver !")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Veuillez telecharger l'application Metamask!")
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);

      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  const post = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {

        setLoading(true);

        /*
        * code qui nous permet de lire du data dans la blockchain(dans notre smart contract)
        * cette transaction est gratuite donc pas de gas fees puisque on fais que lire et on n'apporte pas de changement
        * dans la blockchain
        */

          /*
          * Le provider c'est ce qui nous permet de communiquer avec les noeuds d'ethereum 
          * on utilise des nœuds que Metamask fournit pour envoyer/recevoir des données de notre contrat
          */
          const provider = new ethers.providers.Web3Provider(ethereum)

          /*
          * Plus d'information sur le signer sur la doc de ethers https://docs.ethers.io/v5/api/signer/#signers?
          */
          const signer = provider.getSigner();

          const iftOpinionContract = new ethers.Contract(contractAddress, contractABI, signer);

          let totalPosts = await iftOpinionContract.getTotalPosts();
          console.log("Total Posts....", totalPosts.toNumber());

        /*
        * Code qui nous permet d'ecrire du data dans la blockchain
        * Ici metamask va pop-up et va nous demander de payer un gas-fees
        */
          const postTxn = await iftOpinionContract.post(inputData, { gasLimit: 300000 });
          console.log("Mining Transaction.....", postTxn.hash);

          await postTxn.wait();
          console.log("Transaction Mined! ", postTxn.hash);
          setLoading(false);

          totalPosts = await iftOpinionContract.getTotalPosts();
          console.log("Total Posts....", totalPosts.toNumber());
        
      } else {
        console.log("L'objet ethereum n'existe pas !");
      }      
    } catch (error) {
      console.log(error);
      alert("Svp ressayez dans 1 minutes");
      setLoading(false);
    }
  }

  const getAllPosts = async () => {
    try {
      const { ethereum } = window;

      if(ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const iftOpinionContract = new ethers.Contract(contractAddress, contractABI, signer);

        const posts = await iftOpinionContract.getAllPosts();

        const myPosts = [];
        posts.forEach(post => {
          myPosts.push({
            address: post.poster,
            timestamp: new Date(post.timestamp * 1000),
            data: post.data,
          });
        });
        setAllPosts(myPosts);
      } else {
        console.log("L'objet ethereum n'existe pas !");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const getInputData = (val) => {
    setInputData(val.target.value);
  }



  useEffect(() => {
   checkIfWalletIsConnected();
   let iftOpinionContract;
   const { ethereum } = window;

   const onNewPost = (from, timestamp, message) => {
     console.log("NewPost", from, timestamp, message);
     setAllPosts(prevState => [
       ...prevState,
       {
         address: from,
         timestamp: new Date(timestamp * 1000),
         data: message,
       },
     ]);
   };
 
   if (ethereum) {
     const provider = new ethers.providers.Web3Provider(window.ethereum);
     const signer = provider.getSigner();
 
     iftOpinionContract = new ethers.Contract(contractAddress, contractABI, signer);
     iftOpinionContract.on("NewPost", onNewPost);
   }

   return () => {
    if (iftOpinionContract) {
      iftOpinionContract.off("NewPost", onNewPost);
    }
  };

  }, []);

  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
          Salut IFT-4100 👋👋👋
        </div>

        <div className="bio">
          Je m'apelle Hichem, ce portrail est pour but de permettre aux membres du cours IFT-4100 
          de poster leurs opinions sur le cours ou bien des ressources que vous trouvez utiles 
          pour apprendre le Web3
        </div>


        {currentAccount && (
          <>
            <input type="text" placeholder="type something" onChange={getInputData}/>
            <button className="postButton" onClick={post}>
              Post !
            </button>
          </>
        )}

        { loading && (
          <div>
            <div class="loader"></div>
          </div> 
        )}



        {/*
        * Si il n'y a pas de currentAccount on doit afficher notre button
        */}
        {!currentAccount && (
          
          <button className="postButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {allPosts.map((post, index) =>{
          return (
            <div key={index} style={{backgroundColor: "OldLace", marginTop: "16px", padding: "8px"}}>
              <div>Address: {post.address}</div>
              <div>Temps: {post.timestamp.toString()}</div>
              <div>Message(Ressource): {post.data}</div>
            </div>
          )
        })}
      </div>
    </div>
  )

}

export default App

