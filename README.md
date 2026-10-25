# Mill Valley Finds: self-hosted

This folder is the complete site. The map layers (2.5 m elevation, satellite and lidar tiles, the 1897 and 1954 USGS maps, OpenStreetMap streets) are plain files in `data/`. Finds and their photos are saved in a free Firebase database.

Setup takes about 20 minutes: about 15 in Firebase, then 5 to put it on GitHub Pages.

## 1. Create the Firebase project

1. Go to <https://console.firebase.google.com> and click **Create a project**. Any name works, for example `mill-valley-finds`. You can turn Google Analytics off.
2. On the project home page, click the **Web** icon (`</>`) to add a web app. Give it a nickname and leave Hosting unchecked.
3. Firebase shows a `firebaseConfig` block. Copy its `apiKey`, `authDomain`, `projectId` and `appId` into **`config.js`** in this folder. These values are meant to be public.

## 2. Turn on the database

1. In the left menu: **Build → Firestore Database → Create database**. Choose a location near you (for example `us-west1`) and **production mode**.
2. Open the **Rules** tab, replace everything with the contents of **`firestore.rules`**, and click **Publish**.

## 3. Turn on sign-in

1. **Build → Authentication → Get started**.
2. Under **Sign-in method**, enable **Anonymous**. Visitors who enter the passcode get an anonymous ID, with no account needed.
3. Also enable **Google**. That's how you sign in as the owner to edit or delete anyone's finds.
4. Under **Settings → Authorized domains**, click **Add domain** and enter `YOUR-GITHUB-USERNAME.github.io`.

## 4. Set the passcode and the owner

In **Firestore Database → Data**:

1. **Start collection** named `config`.
2. Add a document with ID `secret` and one field: `code` (type *string*) = your passcode. This is what your collaborator types in.
3. Add another document with ID `admins` and one field: `emails` (type *array*) containing one string, the Google address you'll sign in with.

To change the passcode later, edit `config/secret`. Devices that already unlocked stay unlocked. To lock them out too, delete the documents in the `unlocked` collection.

## 5. Publish on GitHub Pages

1. On GitHub, create a **new repository**, for example `mill-valley-finds`. Free GitHub Pages needs it to be **public**.
2. Click **uploading an existing file** and drag in everything in this folder, including the `data` folder. If the browser won't take the folder in one go, upload `data/` in a second commit.
3. In the repo go to **Settings → Pages**. Set **Source** to *Deploy from a branch*, then choose `main` and `/ (root)`, and click **Save**.
4. After a minute the site is live at `https://YOUR-GITHUB-USERNAME.github.io/mill-valley-finds/`.

## How it works for people

- **Anyone with the link** can explore the map, layers and finds.
- **To add finds**, your collaborator clicks **Log a find**, enters the passcode once, and can then add finds from that device. They can also edit or delete their own finds there.
- **You**: click **Owner sign-in** at the bottom of the ledger and sign in with Google to edit or delete any find.
- Photos are shrunk to about 1600 px so each fits in a single database record. That keeps you on Firebase's free plan, which has room for thousands of finds.

## Privacy note

As set up, **find locations are public** to anyone with the link. To show finds only to passcode holders and you, change this line in `firestore.rules` (in both the `finds` and `photos` sections):

    allow read: if true;

to

    allow read: if canWrite();

Then publish the rules again. Visitors without the passcode will still see the map, just no finds.

## Updating the map layers

The layers are frozen as files. To change them, for example to add another historical map, do it in the Claude version of the page and ask Claude to rebuild this folder. Then upload the changed files to the repo.
