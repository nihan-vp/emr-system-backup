# Welcome to Suhaim Soft Emr Managmnet Systen 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

3. Start the MongoDB API in a second terminal

   ```bash
   npm run server
   ```

4. Make sure MongoDB is running locally, or set `MONGODB_URI` in `.env`

   ```bash
   MONGODB_URI=mongodb://127.0.0.1:27017/clinicppm
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Project structure

```text
clinicppm.site/
   app/
      _layout.js        # Expo Router stack layout
      index.js          # Home route wrapper
      app.js            # Secondary route wrapper
      pages/
         ClinicDashboardPage.js
      components/
         commons/        # Reusable UI primitives and shared widgets
         navbars/        # Top bars, bottom bars, drawer bars
         loaders/        # Splash screens, activity states, skeleton loaders
   assets/
      images/
   scripts/
      reset-project.js
```

Use these folders for future updates:

- Put full route-level screens and page implementations in **app/pages**.
- Put shared widgets and small reusable UI in **app/components/commons**.
- Put any navigation UI in **app/components/navbars**.
- Put loading, splash, and empty-state loading components in **app/components/loaders**.
- Keep the system grouped under **app** so future updates follow one consistent structure.

## MongoDB integration

The project now includes a MongoDB-backed API under **server/**.

- `GET /api/health` checks API and database connectivity.
- `GET /api/state` returns the clinic data used by the Expo app.
- `PUT /api/state/:collection` persists one collection at a time (`appointments`, `patients`, `medicines`, `templates`, `procedures`).
- `POST /api/state/reset` restores the seeded demo dataset.

Environment variables live in `.env` and can be copied from `.env.example`.

- `MONGODB_URI` points the Node API to MongoDB.
- `PORT` changes the API port.
- `EXPO_PUBLIC_API_BASE_URL` overrides the client API base URL for physical devices or remote servers.

If you run Expo on a real phone, set `EXPO_PUBLIC_API_BASE_URL` to your machine's LAN IP, for example `http://192.168.1.20:4000/api`.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
