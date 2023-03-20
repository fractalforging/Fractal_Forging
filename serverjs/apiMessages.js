const responseMap = {
    // LOGIN
    "true": { status: 200, message: "Login successful!" },
    "false": { status: 401, message: "Wrong credentials!" },
    "error1": { status: 401, message: "Error1" },
    "error2": { status: 401, message: "error2" },
    "errorx": { status: 401, message: "errorx" },
    // USER REGISTRATION
    "Taken": { status: 401, message: "Username taken" },
    "Error": { status: 500, message: "Error! Try again" },
    "NoUser": { status: 500, message: "No username given" },
    "NoPass": { status: 500, message: "No password given" },
    "Mismatch": { status: 500, message: "Passwords don't match" },
    "Ok": { status: 200, message: "Account registered!" },
    // PASSWORD
    "Wrong": { status: 401, message: "Old password wrong!" },
    // ACCOUNT MANAGEMENT
    "Deleted": { status: 200, message: "Account deleted" },
    "Role changed": { status: 200, message: "Role changed" },
    // BREAKS
    "Only 1 break at a time": { status: 401, message: "Only 1 break at a time" },
    "Break submitted": { status: 200, message: "Break submitted" },
    // SLOTS AVAILABLE
    "Same value": { status: 401, message: "Same value!" },
    "Updated": { status: 200, message: "Slots updated to" }
};

async function myMessages(req, res, next) {
    const sessionKeys = ["loggedIn", "newAccount", "passChange", "roleChange", "message", "slotsAvailable"];
    for (const key of sessionKeys) {
        const sessionValue = req.session[key];
        if (responseMap.hasOwnProperty(sessionValue)) {
          const { status, message } = responseMap[sessionValue];
          return res.status(status).json({ message });
        }
      }
    }    
module.exports = { myMessages };
