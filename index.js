"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let detailsName = "";
function getRestrictions(r, gender) {
    let restrictions = r.map(r => {
        if (r === "CHILDREN") {
            return "Children";
        }
        else if (r === "FAMILIES") {
            return "Families";
        }
        else if (r === "FAMILIES_YOUNG_CHILDREN") {
            return "Families with young children";
        }
        else if (r === "FAMILIES_NEWBORNS") {
            return "Families with newborns";
        }
        else if (r === "YOUNG_ADULTS") {
            return "Young adults";
        }
        else if (r === "ADULTS") {
            return "Adults";
        }
        else if (r === "SENIORS") {
            return "Seniors";
        }
        else if (r === "VETERANS") {
            return "Veterans";
        }
        else if (r === "NONE") {
            return "None";
        }
        else {
            return r;
        }
    });
    if (gender === "MEN") {
        restrictions.unshift("Men only");
    }
    else if (gender === "WOMEN") {
        restrictions.unshift("Women only");
    }
    else if (gender === "OTHER") {
        restrictions.unshift("Other genders only");
    }
    return restrictions.join(", ");
}
let filter = {
    name: null,
    gender: "Any",
    restrictions: []
};
function passesFilter(shelter) {
    if (filter.name && filter.name.trim() && shelter.shelterName.toLowerCase().indexOf(filter.name.toLowerCase()) === -1) {
        return false;
    }
    if (shelter.gender !== "UNRESTRICTED") {
        if (filter.gender === "Male" && shelter.gender !== "MEN") {
            return false;
        }
        if (filter.gender === "Female" && shelter.gender !== "WOMEN") {
            return false;
        }
        if (filter.gender === "Other" && shelter.gender !== "OTHER") {
            return false;
        }
        if (filter.gender === "All") {
            return false;
        }
    }
    for (let restriction of filter.restrictions) {
        if (shelter.restrictions.indexOf(restriction) === -1) {
            return false;
        }
    }
    return true;
}
class State {
    constructor() {
        this.sections = {
            "login": document.getElementById("login"),
            "register": document.getElementById("register"),
            "home": document.getElementById("home"),
            "shelter-list": document.getElementById("shelter-list"),
            "shelter-detail": document.getElementById("shelter-detail"),
            "shelter-search": document.getElementById("shelter-search"),
        };
        this.handlers = {
            "shelter-search": () => {
                const searchButtonOld = document.getElementById("search");
                // Delete previous event handlers by replacing it
                const searchButton = searchButtonOld.cloneNode(true);
                searchButtonOld.parentElement.replaceChild(searchButton, searchButtonOld);
                searchButton.disabled = false;
                searchButton.addEventListener("click", () => {
                    searchButton.disabled = true;
                    filter.name = document.getElementById("filter-name").value;
                    filter.gender = document.getElementById("filter-gender").value; // fuck it
                    if (document.getElementById("filter-children").checked) {
                        filter.restrictions.push("CHILDREN");
                    }
                    if (document.getElementById("filter-families").checked) {
                        filter.restrictions.push("FAMILIES");
                    }
                    if (document.getElementById("filter-families-young").checked) {
                        filter.restrictions.push("FAMILIES_YOUNG_CHILDREN");
                    }
                    if (document.getElementById("filter-families-newborns").checked) {
                        filter.restrictions.push("FAMILIES_NEWBORNS");
                    }
                    if (document.getElementById("filter-young-adults").checked) {
                        filter.restrictions.push("YOUNG_ADULTS");
                    }
                    if (document.getElementById("filter-adults").checked) {
                        filter.restrictions.push("ADULTS");
                    }
                    if (document.getElementById("filter-seniors").checked) {
                        filter.restrictions.push("SENIORS");
                    }
                    if (document.getElementById("filter-veterans").checked) {
                        filter.restrictions.push("VETERANS");
                    }
                    if (document.getElementById("filter-none").checked) {
                        filter.restrictions.push("NONE");
                    }
                    this.switchTo("shelter-list");
                });
            },
            "shelter-list": () => {
                let list = document.getElementById("shelter-list-actual");
                firebase.database().ref("Shelter").once("value", shelters => {
                    list.innerHTML = "";
                    shelters.forEach(shelter => {
                        if (!passesFilter(shelter.val()))
                            return;
                        let restrictions = getRestrictions(shelter.val().restrictions, shelter.val().gender);
                        list.innerHTML += `
						<tr>
							<td><strong>${shelter.val().shelterName}</strong></td>
							<td rowspan="3"><button class="details" data-name="${shelter.val().shelterName}">Details</button></td>
						</tr>
						<tr><td>Restrictions: ${restrictions}</td></tr>
						<tr><td>Address: ${shelter.val().address}</td></tr>
					`;
                    });
                    let detailsButtons = document.getElementsByClassName("details");
                    for (let i = 0; i < detailsButtons.length; i++) {
                        let button = detailsButtons[i];
                        button.addEventListener("click", () => {
                            detailsName = button.dataset.name;
                            document.getElementById("shelter-detail-back").addEventListener("click", () => this.switchTo("shelter-list"));
                            this.switchTo("shelter-detail");
                        });
                    }
                });
            },
            "shelter-detail": () => {
                firebase.database().ref("Shelter").once("value", shelters => {
                    const uid = firebase.auth().currentUser.uid;
                    let shelter = null;
                    shelters.forEach(s => {
                        if (s.val().shelterName !== detailsName)
                            return;
                        shelter = s.val();
                    });
                    if (!shelter)
                        return;
                    let restrictions = getRestrictions(shelter.restrictions, shelter.gender);
                    let usedCapacity = 0;
                    if (shelter.visitors) {
                        usedCapacity = Object.keys(shelter.visitors).reduce((prev, visitor) => {
                            return prev + shelter.visitors[visitor];
                        }, 0);
                    }
                    document.getElementById("shelter-detail-name").textContent = shelter.shelterName;
                    document.getElementById("shelter-detail-capacity").textContent = `${shelter.capacity - usedCapacity} of ${shelter.capacity}`;
                    document.getElementById("shelter-detail-beds").max = (shelter.capacity - usedCapacity).toString();
                    document.getElementById("shelter-detail-beds").value = "0";
                    document.getElementById("shelter-detail-beds").style.display = "inline";
                    document.getElementById("shelter-detail-phone").textContent = shelter.phoneNumber;
                    document.getElementById("shelter-detail-restrictions").textContent = restrictions;
                    document.getElementById("shelter-detail-notes").textContent = shelter.specialNotes;
                    document.getElementById("shelter-detail-address").textContent = shelter.address;
                    let canReserve = true;
                    if (shelter.visitors && Object.keys(shelter.visitors).indexOf(uid) !== -1 && shelter.visitors[uid] > 0) {
                        canReserve = false;
                        document.getElementById("shelter-detail-beds").style.display = "none";
                    }
                    const reserveButtonOld = document.getElementById("shelter-detail-reserve");
                    // Delete previous event handlers by replacing it
                    const reserveButton = reserveButtonOld.cloneNode(true);
                    reserveButtonOld.parentElement.replaceChild(reserveButton, reserveButtonOld);
                    reserveButton.textContent = canReserve ? "Reserve beds" : `Unreserve ${shelter.visitors[uid]} bed(s)`;
                    reserveButton.disabled = false;
                    if (canReserve && shelter.capacity - usedCapacity <= 0) {
                        reserveButton.disabled = true;
                    }
                    reserveButton.addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
                        reserveButton.disabled = true;
                        if (canReserve) {
                            const userDataRef = firebase.database().ref(`User/${uid}`);
                            userDataRef.once("value", (value) => __awaiter(this, void 0, void 0, function* () {
                                let data = value.val();
                                try {
                                    if (data.bedRequestedShelter >= 0) {
                                        alert("You already have beds selected at another shelter");
                                        return;
                                    }
                                    let num = parseInt(document.getElementById("shelter-detail-beds").value, 10);
                                    if (shelter.capacity < usedCapacity + num || num === 0) {
                                        alert("That many beds are not available");
                                        return;
                                    }
                                    yield Promise.all([
                                        firebase.database().ref(`Shelter/${shelter.uniqueKey}/visitors/${uid}`).set(num),
                                        firebase.database().ref(`User/${uid}/bedRequestedShelter`).set(shelter.uniqueKey)
                                    ]);
                                    this.switchTo("shelter-detail"); // Reload
                                }
                                catch (err) {
                                    console.error(err);
                                    alert(err.message);
                                }
                                finally {
                                    reserveButton.disabled = false;
                                }
                            }));
                        }
                        else {
                            // Unreserving
                            try {
                                yield Promise.all([
                                    firebase.database().ref(`Shelter/${shelter.uniqueKey}/visitors/${uid}`).set(0),
                                    firebase.database().ref(`User/${uid}/bedRequestedShelter`).set(-1)
                                ]);
                                this.switchTo("shelter-detail"); // Reload
                            }
                            catch (err) {
                                console.error(err);
                                alert(err.message);
                            }
                            finally {
                                reserveButton.disabled = false;
                            }
                        }
                    }));
                });
            },
        };
        this.switchTo("login");
    }
    switchTo(panel) {
        for (let key of Object.keys(this.sections)) {
            if (key !== panel) {
                this.sections[key].style.display = "none";
            }
        }
        if (this.handlers[panel]) {
            this.handlers[panel]();
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
        userDataRef.once("value", value => {
            let data = value.val();
            document.getElementById("fill-name").textContent = data.firstName + " " + data.lastName;
            if (data.admin) {
                document.getElementById("fill-name").textContent += " (Admin)";
            }
            state.switchTo("home");
        });
    }
    else {
        console.warn("User signed out!");
        state.switchTo("login");
    }
});
document.getElementById("register-link").addEventListener("click", () => state.switchTo("register"));
document.getElementById("login-link").addEventListener("click", () => state.switchTo("login"));
document.getElementById("shelter-list-link").addEventListener("click", () => {
    filter = {
        name: null,
        gender: "Any",
        restrictions: []
    };
    state.switchTo("shelter-list");
});
document.getElementById("shelter-search-link").addEventListener("click", () => state.switchTo("shelter-search"));
let backButtons = document.getElementsByClassName("back-link");
for (let i = 0; i < backButtons.length; i++) {
    backButtons[i].addEventListener("click", () => state.switchTo("home"));
}
