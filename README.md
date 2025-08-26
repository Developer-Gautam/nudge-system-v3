# Nudge System v2

A modern web application that presents users with questions and sends intelligent reminders (nudges) when they become inactive. Built with React, Node.js, and AWS services.

## 🚀 Features

- **User Authentication**: Secure signup/login with JWT tokens
- **Question Interface**: Beautiful, responsive question answering interface
- **Smart Nudges**: Intelligent inactivity detection with exponential backoff
- **Progress Tracking**: Real-time progress visualization
- **AWS Integration**: SQS for message queuing and EventBridge for scheduling
- **Modern UI**: Beautiful, responsive design with smooth animations

## 🏗️ Architecture

### Frontend (React + Vite)
- **React 18** with modern hooks
- **Vite** for fast development and building
- **React Router** for navigation
- **Axios** for API communication
- **Context API** for state management

### Backend (Node.js + Express)
- **Express.js** REST API
- **MongoDB** with Mongoose ODM
- **JWT** authentication
- **bcryptjs** for password hashing

### AWS Services
- **SQS** for nudge message queuing
- **EventBridge** for scheduled nudge delivery
- **Cognito** (optional) for user management

## 📁 Project Structure

```
nudge-system-v2/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── App.jsx         # Main app component
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/            # AWS configuration
│   ├── middleware/        # Express middleware
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── scripts/          # Database seeding
│   └── index.js          # Server entry point
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- AWS Account (for SQS and EventBridge)

### Backend Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp env.example .env
   ```

4. **Configure environment variables:**
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/nudge-system
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   
   # AWS Configuration
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-aws-access-key-id
   AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
   
   # AWS Services
   SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/your-account-id/your-queue-name
   EVENTBRIDGE_BUS_NAME=default
   ```

5. **Seed the database with questions:**
   ```bash
   npm run seed
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure API URL:**
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

## 🔧 AWS Setup

### SQS Queue
1. Create a Standard SQS queue
2. Note the queue URL for environment configuration
3. Ensure proper IAM permissions for your AWS credentials

### EventBridge
1. Create an EventBridge bus (or use default)
2. Configure IAM roles for EventBridge to invoke SQS
3. Set up proper permissions for rule creation/deletion

### IAM Permissions
Your AWS credentials need the following permissions:
- `sqs:SendMessage`
- `sqs:DeleteMessage`
- `events:PutRule`
- `events:PutTargets`
- `events:DeleteRule`
- `events:DeleteTargets`

## 🎯 Nudge Logic

The system implements intelligent nudge scheduling with exponential backoff:

1. **Initial Delay**: 1 minute of inactivity triggers first nudge
2. **Exponential Backoff**: Each subsequent nudge waits 2x longer
3. **Maximum Nudges**: Stops after 20 nudges (A × X²⁰)
4. **User Inactivation**: Users marked inactive after max nudges

### Nudge Configuration
- **Initial Delay**: 1 minute
- **Multiplier**: 2x (exponential backoff)
- **Max Nudges**: 20
- **Cap**: 24 hours maximum delay

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or local MongoDB
2. Configure AWS credentials and services
3. Deploy to your preferred platform (Heroku, AWS, etc.)
4. Set production environment variables

### Frontend Deployment
1. Build the production version:
   ```bash
   npm run build
   ```
2. Deploy the `dist` folder to your hosting service
3. Configure the API URL for production

## 📱 Usage

1. **Register/Login**: Create an account or sign in
2. **Answer Questions**: Navigate to the questions page
3. **Receive Nudges**: Get friendly reminders if inactive
4. **Track Progress**: View your completion status
5. **Review Answers**: See all your responses

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Protected API routes
- Input validation and sanitization
- CORS configuration

## 🎨 UI/UX Features

- Responsive design for all devices
- Smooth animations and transitions
- Modern gradient backgrounds
- Intuitive navigation
- Real-time progress indicators
- Beautiful nudge overlays

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support or questions, please open an issue in the repository.

---

**Built with ❤️ using React, Node.js, and AWS**
