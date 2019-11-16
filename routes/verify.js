const jwt = require('jsonwebtoken')

const verify = (req, res, next) => {
    const token = req.header('auth')
    if (!token) res.status(401).send({error: "Access Denied"})

    try{
        const verified = jwt.verify(token, process.env.TOKEN_SECRET)
        req.user = verified
        next()
    }catch(err) {
        res.status(404).json(err)
    }
}

module.exports.verify = verify