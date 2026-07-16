# Setup HumanMusic Project

Group Members:

- Qayyum Amin
- Alisa Maisara
- Fernando Amro
- Norshaffira
- Syaloom Pardede

## 1. Clone the repo

- Each team member must clone the repository to their own laptop first.
- Open terminal.

```bash
git clone git@git.rz.tu-bs.de:isf/sep/sep-2026/idsb_humanmusic_1/code.git
```

- If you already cloned the repo before, go into the project folder and run:

```bash
git pull
```

- If cloning does not work because of network or port issues, try using the university VPN first.
- After cloning, open the project folder in your code editor.

# 1.1. Run the project locally

Requirements

- Node.js v20.10 or newer (some dependencies use newer JavaScript syntax that older Node versions cannot parse). Check your version with:
node --version

If it shows something older than v20.10.0, update Node.js first: 

Here is a list for each OS on how you can update Node.js:

### Windows

1. Download and install [nvm-windows](https://github.com/coreybutler/nvm-windows/releases) (`nvm-setup.exe`)
2. Open a new terminal, then run:

```bash
nvm install 20.20.2
nvm use 20.20.2

### macOS


curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.zshrc
nvm install 20
nvm use 20

### Linux (Debias/Ubuntu)

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

At the end you verify the change again with: 
node --version

## 1.2 Start the Server
1. Go to the backend folder: cd backend
2. install the dependencies: npm install
3. Start the server: npm start

Note: On the very first start, the app automatically downloads the
Kokoro TTS model (used for the AI-generated ad break announcements,
~300MB). This needs an internet connection and can take a few minutes.
Every start after that is fast, since the model is cached locally.

4. Open your browser at: http://localhost:3000


### IMPORTANT !

- EVERYONE SHOULD CLONE THE REPOSITORY FIRST.
- DO NOT WAIT UNTIL LATER.
- THE REPOSITORY SHOULD BE THE MAIN SOURCE OF THE PROJECT.
- ALWAYS RUN npm install INSIDE THE backend FOLDER, NOT THE PROJECT ROOT.
- THE FIRST START NEEDS INTERNET ACCESS TO DOWNLOAD THE TTS MODEL.
- IF npm start FAILS WITH A SYNTAX ERROR MENTIONING with, YOUR NODE VERSION IS TOO OLD - UPDATE IT.

---

## 2. Create a branch

- Create a branch for your task or feature.
- DO NOT name the branch only with your name.
- The branch name should describe the work.

Examples:

```bash
git checkout -b feat/index-layout
git checkout -b feat/auth-layout
git checkout -b feat/admin-layout
git checkout -b feat/backend-auth
git checkout -b fix/navbar-spacing
git checkout -b docs/setup-file
```

### Branch Prefixes

Using prefixes in branch names helps the team understand the purpose of each branch quickly.

1. **Feature Branches**  
   Use the prefix `feat/` for new features or page/layout development.

Examples:

- `feat/index-layout`
- `feat/auth-layout`
- `feat/admin-layout`
- `feat/backend-auth`

2. **Bugfix Branches**  
   Use the prefix `fix/` for bug fixes.

Examples:

- `fix/login-modal-close`
- `fix/navbar-overlap`
- `fix/backend-login-validation`

3. **Documentation Branches**  
   Use the prefix `docs/` for documentation or Git guidelines.

Examples:

- `docs/setup-file`
- `docs/api-notes`
- `docs/project-structure`

4. **Style Branches**  
   Use the prefix `style/` for styling changes only.

Examples:

- `style/index-spacing`
- `style/admin-cards`
- `style/button-colors`

5. **Testing Branches**  
   Use the prefix `test/` for testing related work.

Examples:

- `test/login-flow`
- `test/queue-endpoint`

### IMPORTANT !

- DO NOT WORK DIRECTLY ON `main` FOR BIG CHANGES.
- DO NOT CREATE RANDOM BRANCH NAMES LIKE `new`, `update`, `final`, `test1`.
- DO NOT USE ONLY YOUR NAME AS A BRANCH NAME.
- THE BRANCH NAME SHOULD EXPLAIN THE TASK.

---

## 3. Simple Git commands

Before starting work:

```bash
git pull
```

After making changes:

```bash
git add .
git commit -m "your message"
git push
```

### Basic workflow

```bash
git checkout main
git pull
git checkout -b feat/index-layout
# make changes
git add .
git commit -m "feat: add basic index page layout"
git push
```

### IMPORTANT !

- ALWAYS `git pull` BEFORE STARTING NEW WORK.
- DO NOT PUSH WITHOUT CHECKING WHAT CHANGED.
- DO NOT COMMIT EVERYTHING BLINDLY.
- MAKE SURE YOU ARE IN THE CORRECT BRANCH !!!

---

## 4. Good Practice with git commit messages

Commit small changes with clear messages.  
The message should explain **what was changed** and, if possible, **why**.

### Less helpful :(

```bash
git commit -m "feat: add margin"
git commit -m "fix: login"
git commit -m "update file"
git commit -m "change css"
```

### Better

```bash
git commit -m "style: add margin to nav items to prevent them from overlapping the logo"
git commit -m "feat: add login modal structure with username and password inputs"
git commit -m "fix: close login modal when clicking outside the popup"
git commit -m "style: increase spacing between queue cards for better readability"
git commit -m "feat: add submit form for authorized users on the index page"
git commit -m "style: align play button and volume slider in now playing section"
```

### Concrete frontend examples

```bash
git commit -m "feat: add now playing section layout to the index page"
git commit -m "feat: add queue section layout to display upcoming song titles"
git commit -m "style: add padding to queue items to improve readability"
git commit -m "fix: hide authorized user form when no user is logged in"
git commit -m "style: update login modal colors to match the HumanMusic theme"
```

### Concrete backend examples

```bash
git commit -m "feat: add login endpoint for authorized users and admins"
git commit -m "feat: add submit-adbreak endpoint for authorized user text requests"
git commit -m "fix: prevent unauthorized users from accessing admin routes"
git commit -m "refactor: move authentication logic into a separate backend route file"
```

### Type

Must be one of the following:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Formatting, spacing, colors, layout adjustments
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **test**: Adding or updating tests
- **build**: Changes that affect dependencies or build system
- **ci**: Changes to CI configuration files and scripts
- **perf**: A code change that improves performance
- **revert**: Revert a previous commit

### IMPORTANT !

- DO NOT WRITE VAGUE COMMIT MESSAGES LIKE `update`, `fix`, `change`, OR `final`.
- DO NOT PUT TOO MANY UNRELATED CHANGES INTO ONE COMMIT.
- A COMMIT MESSAGE SHOULD HELP YOUR FUTURE SELF AND YOUR TEAMMATES UNDERSTAND THE CHANGE QUICKLY.

---

## 5. Code structure (If it is not suitable, we can change it later)

```text
humanmusic/
├── setup_HumanMusic_final.md
├── .gitignore
├── frontend/
│   ├── index.html
│   ├── admin.html
│   ├── css/
│   │   ├── style.css
│   │   ├── admin.css
│   │   └── components.css
│   ├── js/
│   │   ├── ui.js #SYALOOM NOT FERNANDO
│   │   ├── auth.js
│   │   ├── admin.js
│   │   └── etc...
│   └── assets/
│       ├── icons/
│       ├── images/
│       └── logos/
└── backend/
```

### IMPORTANT !

- FRONTEND AND BACKEND CAN WORK IN PARALLEL.
- HOWEVER, BOTH SIDES MUST AGREE ON:
  - ENDPOINT NAMES
  - REQUEST FORMAT
  - RESPONSE FORMAT
  - FIELD NAMES
  - USER ROLES
  - etc...

- DO NOT RANDOMLY RENAME IDS, CLASS NAMES, OR JSON FIELDS WITHOUT INFORMING THE TEAM !!! PLZ DON'T DO IT GUYSS :(

---

## 6. Team responsibility idea

### Frontend designer

Focus on:

- HTML structure
- CSS styling
- layout and component design
- popup/modal structure
- visual consistency
- etc...

### Frontend integration

Focus on:

- DOM interaction
- fetch requests
- rendering backend data into the UI
- connecting forms and buttons to backend endpoints
- etc...

### Backend team

Focus on:

- authentication
- queue data
- user roles
- ad break approval logic
- password reset
- TTS integration later
- etc...

### IMPORTANT !

- COMMUNICATE BEFORE EDITING SHARED CORE FILES.
- DO NOT LET TWO PEOPLE RANDOMLY EDIT THE SAME FILE WITHOUT COORDINATION.
- IF YOU CHANGE THE STRUCTURE, INFORM THE OTHERS.

---

## 7. Final reminder

Before pushing:

- run `git status`
- check which files changed
- make sure the commit is focused
- write a clear commit message
- push from the correct branch

### IMPORTANT !!!

- THE IMPORTANT PART IS CONSISTENT COMMUNICATION AND A CLEAR STRUCTURE.
- IF SOMETHING IS CONFUSING, BROKEN, OR UNCLEAR, PLEASE SAY IT IN THE GROUP AS SOON AS POSSIBLE. IT IS ALWAYS BETTER TO ASK EARLY THAN TO STAY SILENT AND GET STUCK LATER, COZ SMALL PROBLEMS ARE MUCH EASIER TO SOLVE WHEN WE TALK ABOUT THEM EARLY. IF YOU CHANGE SOMETHING IMPORTANT, LET THE TEAM KNOW. WE ARE WORKING AS A TEAM, SO PLEASE KEEP EVERYONE IN THE LOOP. GOOD LUCK GUYSSSS :D
