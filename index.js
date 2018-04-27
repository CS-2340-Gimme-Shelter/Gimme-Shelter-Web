"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class State {
    constructor() {
        this.sections = {
            "login": document.getElementById("login"),
            "register": document.getElementById("register"),
            "main": document.getElementById("main"),
        };
        this.switchTo("login");
    }
    switchTo(panel) {
        for (let key of Object.keys(this.sections)) {
            if (key !== panel) {
                this.sections[key].style.display = "none";
            }
        }
        if (this.sections[panel]) {
            this.sections[panel].style.display = "block";
        }
    }
}
function convertUTCDateToLocalDate(date) {
    var newDate = new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
    var offset = date.getTimezoneOffset() / 60;
    var hours = date.getHours();
    newDate.setHours(hours - offset);
    return newDate;
}
const state = new State();
document.getElementById("login-submit").addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    try {
        yield firebase.auth().signInWithEmailAndPassword(email, password);
    }
    catch (err) {
        console.error(err);
        alert(err.message);
    }
}));
document.getElementById("logout").addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
    try {
        yield firebase.auth().signOut();
    }
    catch (err) {
        console.error(err);
        alert(err.message);
    }
}));
document.getElementById("register-submit").addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
    let email = document.getElementById("new-email").value;
    let password = document.getElementById("new-password").value;
    let birthday = convertUTCDateToLocalDate(new Date(document.getElementById("birthday").value));
    birthday.setHours(0);
    try {
        let { uid } = yield firebase.auth().createUserWithEmailAndPassword(email, password);
        yield firebase.database().ref(`User/${uid}`).set({
            admin: false,
            bedRequestedShelter: -1,
            birthDate: {
                date: birthday.getDate(),
                day: birthday.getDay(),
                hours: birthday.getHours(),
                minutes: birthday.getMinutes(),
                month: birthday.getMonth(),
                seconds: birthday.getSeconds(),
                time: birthday.valueOf(),
                timezoneOffset: birthday.getTimezoneOffset(),
                year: birthday.getFullYear() - 1900 // Java is so retarded that JavaScript doesn't even support this format anymore
            },
            firebaseUser: {
                anonymous: false,
                email,
                emailVerified: false,
                providerData: [
                    {
                        email,
                        emailVerified: false,
                        providerId: "firebase",
                        uid
                    },
                    {
                        emailVerified: false,
                        providerId: "password",
                        uid: email
                    }
                ],
                providerId: "firebase",
                providers: ["password"],
                uid
            },
            firstName: document.getElementById("first-name").value,
            lastName: document.getElementById("last-name").value,
            gender: document.getElementById("gender").value,
            password,
            username: email
        });
    }
    catch (err) {
        console.error(err);
        alert(err.message);
    }
}));
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        // User is signed in.
        let email = user.email;
        let uid = user.uid;
        const userDataRef = firebase.database().ref(`User/${user.uid}`);
        userDataRef.on("value", value => {
            console.log(value);
            state.switchTo("main");
        });
    }
    else {
        console.warn("User signed out!");
        state.switchTo("login");
    }
});
document.getElementById("register-link").addEventListener("click", () => state.switchTo("register"));
document.getElementById("login-link").addEventListener("click", () => state.switchTo("login"));
