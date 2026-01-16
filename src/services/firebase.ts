import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDHAhfTzTOq-lDZ7UHL0pdv0CRQznVSIxM",
    authDomain: "intellai-283c5.firebaseapp.com",
    projectId: "intellai-283c5",
    storageBucket: "intellai-283c5.appspot.com",
    messagingSenderId: "205159373936",
    appId: "1:205159373936:web:135fb891a5b5d12821e8b5",
    measurementId: "G-7NRB36EGJ7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);