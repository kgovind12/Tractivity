// display first name on main app page
let params = (new URL(document.location)).searchParams;
let name = params.get("userName");
let first_name = name.split(" ")[0];
console.log("User Name Received: "+name);
document.getElementById("username").textContent = first_name;