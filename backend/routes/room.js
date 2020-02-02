const router = require('express').Router();

router.route('/').put((req,res) => {
    res.send('hello');
    
});

module.exports = router;