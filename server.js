/* eslint-disable max-len *//* eslint-disable no-console *//* eslint-disable object-curly-newline *//* eslint-disable linebreak-style */
require('./mongoconnect');

const { buildSchema } = require('graphql');
const { graphqlHTTP } = require('express-graphql');
const jwt = require('jsonwebtoken');

const jwtSecret = 'husshh';
const express = require('express');
const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');

const schema = buildSchema(`
  "The data the user needs to enter to register"
  input UserRegistrationInput {
    username: String!
    password: String!
    firstName: String!
    lastName: String!
    age: Int
  }
  type LoginPayload {
    token: String
    error: String
  }
  type User{
    firstName: String!
    lastName: String!
    age: Int
  }
  type Post{
    content: String!
    user: User!
  }
  type Comment{
    content: String!
    user: User!
    post: Post!
  }
  type Query{
    hello: String
    getMyPosts(token: String): [Post!]!
    getPostComments(token: String, postId:String): [Comment!]!
    getAllPosts: [Post!]!
  }
  type Mutation{
    createUser(userData: UserRegistrationInput): User
    loginUser(username: String, password: String): LoginPayload
    postCreate(token:String, content:String): String
    postDelete(token:String, postId:String): String
    postEdit(token:String, postId:String, content:String): String
    commentCreate(token:String, content:String, postId:String): String
  }
`);


const userMutations = {
  createUser: async ({
    userData: { username, password, firstName, lastName, age },
  }) => {
    const user = new User({ username, password, firstName, lastName, age });
    await user.save();
    return { firstName, lastName, age };
  },
  loginUser: async ({ username, password }) => {
    const user = await User.findOne({ username });
    if (!user) return { error: 'Login failed' };
    if (user.password !== password) return { error: 'Login failed' };
    const token = jwt.sign({ userId: user.id }, jwtSecret);
    return { token };
  },
};

const auth = async (token) => {
  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = User.findById(payload.userId);
    return user;
  } catch (error) {
    return null;
  }
};

const postsMutation = {
  postCreate: async ({ content, token }) => {
    const user = await auth(token);
    if (!user) return 'Authentication error';

    try {
      const userId = user.id;
      const post = new Post({ userId, content });
      await post.save();
      return post;
    } catch (error) {
      return 'Post Deletetion Failed';
    }
  },
  postDelete: async ({ token, postId }) => {
    const user = await auth(token);
    if (!user) return 'Authentication error';

    try {
      const userId = user.id;
      await Post.deleteOne({ _id: postId });
      const posts = await Post.find({ userId });
      return posts;
    } catch (err) {
      return 'Post Deletetion Failed';
    }
  },
  postEdit: async ({ token, content, postId }) => {
    const user = await auth(token);
    if (!user) return 'Authentication error';

    try {
      const post = await Post.findOneAndUpdate({ _id: postId }, { content });
      return post;
    } catch (error) {
      return 'Post Alteration Failed';
    }
  },
};

const commentsMutation = {
  commentCreate: async ({ token, content, postId }) => {
    const user = await auth(token);
    if (!user) return 'Authentication error';
    const userId = user.id;
    const comment = new Comment({ content, userId, postId });
    await comment.save();
    return user.Comment;
  },

};


const postsQuery = {
  getMyPosts: async ({ token }) => {
    const user = await auth(token);
    if (!user) return 'Authentication error';
    const userId = user.id;
    const posts = await Post.find({ userId });
    return posts.map(p => ({ ...p, user }));
  },

  getAllPosts: async () => {
    const posts = await Post.find({}).populate('userId');
    return posts.map(p => ({ ...p.toJSON(), user: p.userId }));
  },
};

const commentsQuery = {
  getPostComments: async ({ token, postId }) => {
    const user = await auth(token);
    if (!user) return 'Authentication error';
    const comments = await Comment.find({ postId });
    return comments;
  },
};


const rootValue = {
  ...userMutations,
  ...postsMutation,
  ...commentsMutation,
  ...postsQuery,
  ...commentsQuery,
  hello: () => 'Hello world2',
};

const app = express();

app.use('/graphql', graphqlHTTP({ schema, rootValue, graphiql: true }));

app.listen(5000, () => {
  console.log('Server is runing');
});
