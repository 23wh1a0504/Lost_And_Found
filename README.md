# Lost_And_Found
# 🧳 Lost and Found Portal for College Hostel

A web-based Lost and Found Portal designed for college hostels where students can report lost or found items, and administrators can manage and verify the postings.

---

## 📌 Project Overview

The **Lost and Found Portal** helps hostel students easily report lost items and post found items with images and descriptions. The system ensures transparency and quick recovery of belongings through a centralized online platform.

---

## 👥 User Roles

### 1. User (Student)
- Register and log in
- Upload lost item details with image
- Upload found item details with image
- View all lost and found items
- Search and filter items
- Contact the person who posted the item

### 2. Administrator
- Secure admin login
- View and manage all item posts
- Approve or reject user submissions
- Delete inappropriate or duplicate posts
- Mark items as returned
- Manage user accounts

---

## ✨ Features

- User authentication (Login & Registration)
- Upload item images
- Lost and Found item categorization
- Admin approval system
- Item status tracking (Lost / Found / Returned)
- Search and filter functionality
- Responsive UI

---

## 🛠️ Technology Stack

### Frontend
- HTML
- CSS
- JavaScript
- Bootstrap

### Backend
- PHP

### Database
- MySQL

---

## 🗂️ Database Structure

### Users Table
- user_id
- name
- email
- password
- role (user/admin)

### Items Table
- item_id
- user_id
- item_name
- category
- description
- location
- date
- image
- type (lost/found)
- status (pending/approved/returned)

---

## 🔄 Application Workflow

1. User registers and logs in
2. User submits lost or found item details
3. Admin reviews and approves the post
4. Approved items are visible to all users
5. Item is marked as returned once claimed

---

## 🚀 How to Run the Project

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/lost-and-found-portal.git
