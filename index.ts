declare const firebase: any;

class State {
	private sections = {
		"login": document.getElementById("login"),
		"register": document.getElementById("register"),
		"main": document.getElementById("main"),
	};

	constructor() {
		this.switchTo("login");
	}

	public switchTo(panel: keyof State["sections"]): void {
		for (let key of Object.keys(this.sections)) {
			if (key !== panel) {
				this.sections[key].style.display = "none";
			}
		}
		if (this.sections[panel]) {
			this.sections[panel]!.style.display = "block";
		}
	}
}
function convertUTCDateToLocalDate(date: Date): Date {
	var newDate = new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
	var offset = date.getTimezoneOffset() / 60;
	var hours = date.getHours();
	newDate.setHours(hours - offset);
	return newDate;
}

const state = new State();

document.getElementById("login-submit")!.addEventListener("click", async () => {
	let email = (document.getElementById("email") as HTMLInputElement).value;
	let password = (document.getElementById("password") as HTMLInputElement).value;
	try {
		await firebase.auth().signInWithEmailAndPassword(email, password);
	}
	catch (err) {
		console.error(err);
		alert(err.message);
	}
});
document.getElementById("logout")!.addEventListener("click", async () => {
	try {
		await firebase.auth().signOut();
	}
	catch (err) {
		console.error(err);
		alert(err.message);
	}
});
document.getElementById("register-submit")!.addEventListener("click", async () => {
	let email = (document.getElementById("new-email") as HTMLInputElement).value;
	let password = (document.getElementById("new-password") as HTMLInputElement).value;
	let birthday = convertUTCDateToLocalDate(new Date((document.getElementById("birthday") as HTMLInputElement).value));
	birthday.setHours(0);
	try {
		let { uid } = await firebase.auth().createUserWithEmailAndPassword(email, password);
		await firebase.database().ref(`User/${uid}`).set({
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
			firstName: (document.getElementById("first-name") as HTMLInputElement).value,
			lastName: (document.getElementById("last-name") as HTMLInputElement).value,
			gender: (document.getElementById("gender") as HTMLSelectElement).value,
			password, // Plain text / super secure!
			username: email
		});
	}
	catch (err) {
		console.error(err);
		alert(err.message);
	}
});

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

document.getElementById("register-link")!.addEventListener("click", () => state.switchTo("register"));
document.getElementById("login-link")!.addEventListener("click", () => state.switchTo("login"));
