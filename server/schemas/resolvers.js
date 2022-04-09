// TODO: This file
const { AuthenticationError } = require("apollo-server-express");
const { User } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    // ?? This query is returning an error in graphql saying I'm not logged in. How should I be finding a single user?
    me: async (parent, args, context) => {
      if (context.user) {
        console.log(context);
        const userData = await User.findOne({ _id: context.user._id })
          .populate("savedBooks")
          .select("-__v-password");

        return userData;
      }
      throw new AuthenticationError("Not Logged In");
    },
    // Best practice is to use an underscore if you're not going to use it ie. (_, _, context)
    // me: async (parent, args, context) => {
    //     if(context.user) {
    //         const userData = await User.findOne(
    //             {_id: context.user._id}).select('-__v-password');

    //         return userData
    //     }
    //     throw new AuthenticationError('Not Logged In');
    // }
  },

  Mutation: {
    /** (parent, args, context) */
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);

      return { token, user };
    },
    // Destructuring email and password out of args
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError("Incorrect email");
      }

      const correctPassword = await user.isCorrectPassword(password);

      if (!correctPassword) throw new AuthenticationError("Incorrect password");

      const token = signToken(user);
      return { token, user };
    },

    saveBook: async (parent, { bookData }, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: bookData } },
          { new: true, runValidators: true }
        );

        return updatedUser;
      }
    },

    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId: bookId } } },
          { new: true }
        );

        return updatedUser;
      }
    },
  },
};

module.exports = resolvers;
