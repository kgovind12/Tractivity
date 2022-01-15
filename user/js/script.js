// display first name on main app page
let params = (new URL(document.location)).searchParams;
let username = params.get("userName");
let first_name = username.split(" ")[0];
console.log("User Name Received: " + username);
document.getElementById("username").textContent = first_name;