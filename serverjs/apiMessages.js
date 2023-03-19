
async function myMessages(req, res, next) {
    // LOGIN
    if (req.session.loggedIn === "true") {
        //return res.status(200).json({ message: 'Login successful!' });
    } else if (req.session.loggedIn === "false") {
        return res.status(401).json({ message: 'Wrong credentials!' });
    } else if (req.session.loggedIn === "error1") {
        return res.status(401).json({ message: 'Error1' });
    } else if (req.session.loggedIn === "error2") {
        return res.status(401).json({ message: 'error2' });
    } else if (req.session.loggedIn === "errorx") {
        return res.status(401).json({ message: 'errorx' });
    }
    // USER REGISTRATION
    if (req.session.newAccount === "Ok") {
        return res.status(200).json({ message: 'Account registered!' });
    } else if (req.session.newAccount === "Taken") {
        return res.status(401).json({ message: 'Username taken' });
    } else if (req.session.newAccount === "Error") {
        return res.status(500).json({ message: 'Error! Try again' });
    } else if (req.session.newAccount === "NoUser") {
        return res.status(500).json({ message: 'No username given' });
    } else if (req.session.newAccount === "NoPass") {
        return res.status(500).json({ message: 'No password given' });
    } else if (req.session.newAccount === "Mismatch") {
        return res.status(500).json({ message: "Passwords don't match" });
    }
    // PASSWORD
    if (req.session.passChange === "Ok") {
        return res.status(200).json({ message: 'Password changed!' });
    } else if (req.session.passChange === "Wrong") {
        return res.status(401).json({ message: 'Old password wrong!' });
    } else if (req.session.passChange === "Error") {
        return res.status(500).json({ message: 'Error! Try again.' });
    } else if (req.session.passChange === "Mismatch") {
        return res.status(500).json({ message: "Passwords don't match" });
    }
    // ACCOUNT MANAGEMENT
    if (req.session.roleChange === "Role changed") {
        return res.status(200).json({ message: 'Role changed' });
    } else if (req.session.roleChange === "Error1") {
        return res.status(401).json({ message: 'Error! Try again.' });
    } else if (req.session.roleChange === "Error2") {
        return res.status(401).json({ message: 'Error! Try again.' });
    } else if (req.session.roleChange === "Deleted") {
        return res.status(200).json({ message: "Account deleted" });
    }
    // BREAKS
    if (req.session.message === 'Only 1 break at a time') {
        return res.status(401).json({ message: 'Only 1 break at a time' });
    } else if (req.session.message === 'Break submitted') {
        return res.status(200).json({ message: 'Break submitted' });
    }
    // SLOTS AVAILABLE
    if (req.session.slotsAvailable === 'Error') {
        return res.status(401).json({ message: 'Error! Try again' });
    } else if (req.session.slotsAvailable === 'Updated') {
        return res.status(200).json({ message: 'Slots updated' });
    }
}

// Export as module
module.exports = { myMessages };