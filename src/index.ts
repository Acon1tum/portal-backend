import express, { Request, Response } from 'express';
import cors from 'cors';
import session from 'express-session'; // Import express-session
import authRouter from './auth/login';
import roleRouter from './roles-and-permissions/role';
import editRoleRouter from './roles-and-permissions/edit-roles';
import userRouter from './users/users';
import createUserRouter from './users/createUser';
import userProfileRouter from './auth/fetch-profile';
import userDevicesRouter from './auth/user-devices/add-device';
import checkSessionRouter from './auth/check-session';
import logoutRouter from './auth/logout';
import cookieParser from 'cookie-parser';
import createBusiness from './business/createBusiness'
import updateBusiness from './business/updateBusiness'
import deleteBusiness from './business/deleteBusiness'
import updateBusinessVerificationStatus from './business/updateVerificationStatus'
import businessRoutes from './business/businesses'
import createTagline from './tagline-category/createTagline'
import taglines from './tagline-category/taglines'
import updateTagline from './tagline-category/updateTagline'
import deleteTagline from './tagline-category/deleteTagline'
import createMessage from './message/createMessage'
import messages from './message/messages'
import updateMessage from './message/updateMessage'
import deleteMessage from './message/deleteMessage'
import updateMessageStatus from './message/updateMessageStatus'
import emailAndPassSignup from './auth/signup-email-and-pass/signup'
const app = express();
const port = process.env.PORT || 3200;

// Configure express-session. 
// Replace 'your-secret-key' with a strong, secure secret (or store it in an environment variable).
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set secure to true if using HTTPS make this tru when production
}));
app.use(express.json());  
app.use(cookieParser());

app.use(
  cors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-email'],
  })
);

app.options('*', cors());
app.use(express.json());

// Mount auth routes under /auth
app.use('/auth', authRouter);


// signup for email and password only
app.use('/auth/signup-email-and-pass/signup', emailAndPassSignup);


app.use('/auth/check-session', checkSessionRouter); // Check session endpoint
app.use('/auth/logout', logoutRouter); // Logout endpoint
app.use('/roles', roleRouter);
app.use('/roles/editRole', editRoleRouter);
app.use('/users', userRouter);
app.use('/users/create', createUserRouter);
app.use('/user/devices', userDevicesRouter);
app.use('/user/profile', userProfileRouter);

// business 
app.use('/businesses', businessRoutes)
app.use('/businesses/create', createBusiness)
app.use('/businesses/update', updateBusiness)
app.use('/businesses/delete', deleteBusiness)
app.use('/businesses/verify', updateBusinessVerificationStatus)

// tagline category @relation to business
app.use('/taglines/create', createTagline)
app.use('/taglines', taglines)
app.use('/taglines/update', updateTagline)
app.use('/taglines/delete', deleteTagline)
// messages
app.use('/messages/create', createMessage)
app.use('/messages', messages)
app.use('/messages/update', updateMessage)
app.use('/messages/delete', deleteMessage)
app.use('/messages/status', updateMessageStatus)


// Basic route
app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Express with TypeScript!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
