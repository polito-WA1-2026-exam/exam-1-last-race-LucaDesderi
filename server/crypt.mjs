//Generate the hashing for the passwords in the db using bcrypt
import bcrypt from "bcrypt";

let password = "password123";
let hash = await bcrypt.hash(password, 10);
console.log(hash);

password = "secret456";
hash = await bcrypt.hash(password, 10);
console.log(hash);

password = "aiueo789";
hash = await bcrypt.hash(password, 10);
console.log(hash);