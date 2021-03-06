const express = require('express');
const bcrypt = require('bcrypt');
const utils = require('../src/utils');
const router = express.Router();

//========= Databases
const urlDatabase = {
  // "b2xVn2": "http://www.lighthouselabs.ca",
  // "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

//========= for '/'
router.get('/', (req, res) => {
  res.send('Hello!');
});

//========= for '/urls'
router.get('/urls', (req, res) => {
  const currentUser = req.session.user_id;
  if (currentUser) {
    let templateVars = {
      database: utils.urlsForUser(urlDatabase, currentUser),
      user: users[currentUser]
    };
    
    res.render('urls_index', templateVars);
  } else {
    res.redirect('/login');
  }
});

router.post('/urls', (req, res) => {
  const userID = req.session.user_id;
  const shortURL = utils.generateRandomString(6);
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = { longURL, userID };

  res.redirect(`/urls/${shortURL}`);
});


//========= for '/urls/~'
router.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

router.get('/urls/new', (req, res) => {
  if (users[req.session.user_id] === undefined) {
    res.redirect('/login');
  }

  let templateVars = {
    user: users[req.session.user_id]
  };
  res.render('urls_new', templateVars);
});

router.get('/urls/:shortURL', (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.session.user_id]
  };
  res.render('urls_show', templateVars);
});

router.post('/urls/:newURL', (req, res) => {
  const currentUser = req.session.user_id;

  if (currentUser) {
    const key = req.params.newURL;
    const newURL = req.body.newURL;
    urlDatabase[key].longURL = newURL;
  }

  res.redirect('/urls');
});

//========= for '/u/~'
router.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;

  res.redirect(longURL);
});

//========= for '/u/~/delete'
router.post('/urls/:shortURL/delete', (req, res) => {
  const currentUser = req.session.user_id;

  if (currentUser) {
    delete urlDatabase[req.params.shortURL];
  }

  res.redirect('/urls');
});

//========= for '/login'
router.get('/login', (req, res) => {
  let templateVars = { user: 'existing'};
  res.render('urls_login', templateVars);
});

router.post('/login', (req, res) => {
  const userEmail = req.body.email;
  const userPass = req.body.password;

  for (let user in users) {
    if (utils.checkValinObj(users[user], userEmail) && bcrypt.compareSync(userPass, users[user].password)) {
      req.session.user_id = users[user].id;
      res.redirect('/urls');
      return;
    }
  }

  res.statusCode = 400;
  res.render('urls_error', { errorMsg: 'Invalid e-mail or password!', user: '' });
});

//========= for '/logout'
router.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

//========= for '/register'
router.get('/register', (req, res) => {
  let templateVars = {
    user: 'registering'
  };
  res.render('urls_register', templateVars);
});

router.post('/register', (req, res) => {
  const userEmail = req.body.email;

  for (let user in users) {
    if (utils.checkValinObj(users[user], userEmail)) {
      res,statusCode = 400;
      res.render('urls_error', { errorMsg: 'E-mail already exists!', user: '' });
    }
  }
  
  const userPass = bcrypt.hashSync(req.body.password, 10);
  const userID = utils.generateRandomString(5); // user ID length 5

  users[userID] = {
    id: userID,
    email: userEmail,
    password: userPass
  };

  req.session.user_id = userID;
  res.redirect('/urls');
});

//========= for '/error'
router.get('/error', (req, res) => {
  res.render('urls_error', { user: 'registering' });
});


module.exports = router;