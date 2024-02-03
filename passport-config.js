const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;

function initPass(passport, getUserByUsername, getUserByID){
    const authenticateUser = async (username, password, done) => {
        const user = getUserByUsername(username);

        if(user == null){
            return done(null, false, {message: 'Username not found!'});
        }

        try{
            if(await bcrypt.compare(password, user.password)){
                return done(null, user);
            } else {
                return done(null, false, {message: 'Incorrect password!'});
            }
        } catch (e){
            return done(e);
        }
    }

    passport.use(new LocalStrategy({usernameField: 'username'}, authenticateUser));
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((id, done) => {
        return done(null, getUserByID(id))
    });
}

module.exports = initPass;