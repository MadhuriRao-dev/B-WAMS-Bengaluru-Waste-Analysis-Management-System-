import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD-ZSN2CEt6V1Yvs_TAeA_nK9699FrQxbI",
    authDomain: "b-wams.firebaseapp.com",
    projectId: "b-wams",
    storageBucket: "b-wams.firebasestorage.app",
    messagingSenderId: "35941311522",
    appId: "1:35941311522:web:7b31fc8ab0f15efef1967b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
