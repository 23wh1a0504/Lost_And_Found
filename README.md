# Lost And Found

A full-stack lost and found portal for college hostels. Students can register, post lost or found items with images, browse approved listings, and contact the poster. Admins can review submissions, approve or reject posts, and mark items as returned.

---

## Project Overview

This project is built as a modern hostel lost-and-found workflow:

- Users create an account and sign in
- Users submit lost or found item reports
- Admins review posts before they appear publicly
- Approved items are visible in the browse page
- Returned items move into returned history

---

## User Roles

### User
- Register and log in
- Create lost and found posts
- Upload an image for an item
- Edit or delete their own posts
- View approved and returned items
- Contact the poster by email

### Admin
- Log in with an admin account
- View all submitted posts
- Approve, reject, or return items
- Delete any item
- View the user list

---

## Features

- Authentication with JWT
- User registration and login
- Lost and found item reporting
- Image upload support with Multer
- Admin moderation workflow
- Item status tracking: pending, approved, rejected, returned
- Public browse page with search and filters
- Returned items history page
- Responsive React frontend

---

## Technology Stack

### Frontend
- React
- Vite
- JavaScript
- CSS
- React Router DOM

### Backend
- Node.js
- Express.js
- JWT Authentication
- Multer

### Database
- MongoDB

### Other Tools
- bcryptjs
- dotenv
- cors
- nodemon

---

## Project Structure

- `Backend/` - Express server, routes, controllers, models, middleware, and scripts
- `Frontend/` - React + Vite client
- `uploads/` - uploaded item images

This project is not built with PHP, MySQL, or Bootstrap. The current implementation uses React on the frontend and Node.js, Express, and MongoDB on the backend.

---

## API Overview

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Items
- `POST /api/items`
- `GET /api/items`
- `GET /api/items/count`
- `GET /api/items/:id`
- `PUT /api/items/:id`
- `PATCH /api/items/:id/status`
- `DELETE /api/items/:id`

### Users
- `GET /api/users` - admin only

---

## Data Model

### User
- `name`
- `email`
- `password`
- `role`

### Item
- `user_id`
- `item_name`
- `category`
- `description`
- `location`
- `date`
- `image`
- `type`
- `status`

---

## Environment Variables

Create a `.env` file in the project root and set:

```env
MONGO_URI=mongodb://127.0.0.1:27017/lost_and_found
JWT_SECRET=your_secret_here
PORT=5000
```

Optional admin seed values used by `create:admin`:

```env
ADMIN_NAME=Hostel Admin
ADMIN_EMAIL=admin@hostel.com
ADMIN_PASSWORD=Admin123!
```


---

## How To Run

1. Clone the repository:

```bash
git clone https://github.com/23wh1a0504/Lost_And_Found.git
cd Lost_And_Found
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` in the project root and add your values.

4. Start MongoDB locally.

5. Create the admin account:

```bash
npm run create:admin
```

6. Optionally seed sample data:

```bash
npm run seed:items
```

7. Start the backend:

```bash
npm start
```

8. In another terminal, start the frontend:

```bash
npm run client
```

---

## Default Local URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

---

## Notes

- Uploaded images are stored in the local `uploads/` folder
- Public browsing shows visible items, while admins can access all moderation states
- Returned items are available in a separate history view


Screen Recording of the project:
https://drive.google.com/file/d/1LTJGcaRIfdoX5_rZnRUyOODjqH14Ws11/view?usp=sharing
