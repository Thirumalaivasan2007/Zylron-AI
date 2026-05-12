import { createContext, useState, useEffect, useContext } from 'react';
import { 
    onAuthStateChanged, 
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut, 
    sendSignInLinkToEmail, 
    isSignInWithEmailLink, 
    signInWithEmailLink,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail
} from "firebase/auth";
import { auth, googleProvider, facebookProvider } from "../config/firebase";
import Loader from '../components/Loader';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const minLoadTime = new Promise(resolve => setTimeout(resolve, 3500));
        let initialCheckDone = false;

        // ✅ Capture redirect result (Google/Facebook after redirect auth)
        getRedirectResult(auth).then((result) => {
            if (result?.user) {
                console.log('✅ Redirect auth success:', result.user.email);
            }
        }).catch((err) => {
            // Ignore — no redirect pending
        });

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser({
                    uid: currentUser.uid,
                    name: currentUser.displayName,
                    email: currentUser.email,
                    photoURL: currentUser.photoURL,
                    token: currentUser.accessToken
                });
            } else {
                setUser(null);
            }
            
            if (!initialCheckDone) {
                initialCheckDone = true;
                await minLoadTime;
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // ✅ signInWithPopup — Electron popup window handles this correctly now
    const loginWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Google login error:', error.code);
            return { success: false, message: error.message };
        }
    };

    const loginWithFacebook = async () => {
        try {
            const result = await signInWithPopup(auth, facebookProvider);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const registerWithEmailPassword = async (email, password) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const loginWithPassword = async (email, password) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const resetPassword = async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const loginWithEmail = async (email) => {
        const actionCodeSettings = {
            url: window.location.origin + '/login',
            handleCodeInApp: true,
        };
        try {
            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            window.localStorage.setItem('emailForSignIn', email);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            loginWithGoogle, 
            loginWithFacebook, 
            loginWithEmail,
            loginWithPassword,
            registerWithEmailPassword,
            resetPassword,
            logout, 
            loading 
        }}>
            {loading ? <Loader /> : children}
        </AuthContext.Provider>
    );
};
