const mongoose = require("mongoose")
const Pet = require("../pets/model-pets")
const User = require("./model-users")
const Album = require("../albums/model-albums")
const ObjectId = mongoose.Types.ObjectId
const fs = require("fs-extra")

class ServiceUser {
  constructor() {}

  getAllUsers = async function() {
    try {
      return await User.find({})
    } catch (e) {
      console.log(e)
    }
  }

  getFilteredUsers = async function(value) {
    try {
      return await User.find({
        login: { $regex: `${value}\.*`, $options: "i" }
      })
    } catch (e) {
      console.log(e)
    }
  }

  getUserById = async function(id) {
    try {
      return await User.findById(id)
    } catch (e) {
      console.log(e)
    }
  }

  addUser = async function(body) {
    const user = new User(body)
    await user.save()
    if (!(await fs.pathExists(`public/images/users/${user._id}`))) {
      await fs.ensureDir(`public/images/users/${user._id}`)
    }
    const token = await user.generateAuthToken()
    return { user, token }
  }

  updateUserById = async function(id, body) {
    try {
      console.log(body)
      return await User.findByIdAndUpdate(id, body)
    } catch (e) {
      console.log(e)
    }
  }

  deleteUserById = async function(id) {
    try {
      if (await fs.pathExists(`public/images/users/${id}`)) {
        await fs.remove(`public/images/users/${id}`)
      }
      return await User.deleteOne({ _id: id })
    } catch (e) {
      console.log(e)
    }
  }

  getUserPetsById = async function(id) {
    try {
      return await Pet.find({ owner: id }).populate("owner")
    } catch (e) {
      console.log(e)
    }
  }

  getUserWithPetsById = async function(id) {
    try {
      return await User.aggregate([
        {
          $match: { _id: new ObjectId(id) }
        },
        {
          $lookup: {
            from: "pets",
            localField: "_id",
            foreignField: "owner",
            as: "pets"
          }
        }
      ])
    } catch (e) {
      console.log(e)
    }
  }

  getUserWithAlbumsById = async function(id) {
    try {
      return await User.aggregate([
        {
          $match: { _id: new ObjectId(id) }
        },
        {
          $lookup: {
            from: "albums",
            localField: "_id",
            foreignField: "ownerUser",
            as: "albums"
          }
        }
      ])
    } catch (e) {
      console.log(e)
    }
  }

  getListAlbumsWithPhotosByUserID = async function(id) {
    try {
      return await Album.aggregate([
        {
          $match: { ownerUser: ObjectId(id) }
        },
        {
          $lookup: {
            from: "photos",
            localField: "_id",
            foreignField: "ownerAlbum",
            as: "photos"
          }
        }
      ])
    } catch (e) {
      console.log(e)
    }
  }

  getUserWithPhotosById = async function(id) {
    try {
      return await User.aggregate([
        {
          $match: { _id: new ObjectId(id) }
        },
        {
          $lookup: {
            from: "photos",
            localField: "_id",
            foreignField: "ownerUser",
            as: "photos"
          }
        }
      ])
    } catch (e) {
      console.log(e)
    }
  }

  loginUser = async function(login, password) {
    const user = await User.findByCredentials(login, password)
    const token = await user.generateAuthToken()
    return { user, token }
  }

  logOutCurrentDevice = async function(user, currentToken) {
    user.tokens = await user.tokens.filter(tkn => {
      return tkn.token !== currentToken
    })
    await user.save()
  }

  logOutAllDevices = async function(user, currentToken) {
    const ind = await user.tokens.findIndex(tkn => tkn.token === currentToken)
    if (ind !== -1) {
      user.tokens = []
    } else {
      throw new Error("the token don't exist")
    }
    await user.save()
  }

  deleteUserWithPets = async function(id) {
    try {
      const deletePets = await Pet.deleteMany({ owner: id })
      const deleteUser = await User.deleteOne({ _id: id })
      return deletePets, deleteUser
    } catch (e) {
      console.log(e)
    }
  }

  getUserWithSubscriptionsById = async function(id) {
    try {
      // console.log(id)
      // let responseArray =
      return await User.aggregate([
        {
          $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "responseSubscriberId",
            as: "subscriptions"
          }
        },
        {
          $project: {
            subscriptions: {
              $map: {
                input: "$subscriptions",
                as: "subscriptions",
                in: [
                  "$$subscriptions.requestSubscriberId",
                  id,
                  {
                    $cond: {
                      if: {
                        $gte: ["$$subscriptions.requestSubscriberId", id]
                      },
                      then: "subscriber",
                      else: false
                    }
                  }
                ]
              }
            },
            login: 1,
            role: 1,
            firstName: 1,
            lastName: 1,
            email: 1,
            phone: 1,
            avatar: 1
          }
        },
        {
          $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "requestSubscriberId",
            as: "observers"
          }
        },
        {
          $addFields: {
            observers: {
              $map: {
                input: "$observers",
                as: "observers",
                in: [
                  "$$observers.responseSubscriberId",
                  id,
                  {
                    $cond: {
                      if: {
                        $gte: ["$$observers.responseSubscriberId", id]
                      },
                      then: "observers",
                      else: false
                    }
                  }
                ]
              }
            }
          }
        },
        {
          $lookup: {
            from: "friends",
            localField: "_id",
            foreignField: "responseFriendId",
            as: "responseFriends"
          }
        },
        {
          $addFields: {
            requestFriends: {
              $map: {
                input: "$requestFriends",
                as: "requestFriends",
                in: [
                  "$$requestFriends.requestFriendId",
                  id,
                  {
                    $cond: {
                      if: {
                        $gte: ["$$requestFriends.requestFriendId", id]
                      },
                      then: "requestFriend",
                      else: false
                    }
                  }
                ]
              }
            }
          }
        },
        {
          $lookup: {
            from: "friends",
            localField: "_id",
            foreignField: "requestFriendId",
            as: "requestFriends"
          }
        },
        {
          $addFields: {
            responseFriends: {
              $map: {
                input: "$responseFriends",
                as: "responseFriends",
                in: [
                  "$$responseFriends.responseFriendId",
                  id,
                  {
                    $cond: {
                      if: {
                        $gte: ["$$responseFriends.responseFriendId", id]
                      },
                      then: "responseFriend",
                      else: false
                    }
                  }
                ]
              }
            }
          }
        }
      ])
      responseArray = responseArray.map(user => {
        if (user.subscriptions[0] !== undefined) {
          console.log(user.subscriptions)
          if (user.subscriptions[0][2] === "subscriber")
            return Object.assign(user, (user.subscriptions0 = "subscriber"))
          if (user.subscriptions[0][2] === "observer")
            return Object.assign({}, user, (user.subscriptions = "observer"))
          if (user.subscriptions[0][2] === "friend")
            return Object.assign({}, user, (user.subscriptions = "friend"))
        }
        if (user.subscriptions[0] === undefined) return user
      })
      // return responseArray
    } catch (e) {
      console.log(e)
    }
  }
}

module.exports = ServiceUser

//   {
//     $lookup: {
//       from: "subscriptions",
//       localField: "_id",
//       foreignField: "responseSubscriberId",
//       as: "subscriptions"
//     }
//   },
//   {
//     $lookup: {
//       from: "friends",
//       localField: "_id",
//       foreignField: "responseSubscriberId",
//       as: "friends"
//     }
//   }
// {
//   $project: {
//     subscriptions2: {
//       $cond: [
//         {
//           $eq: ["$subscriptions.responseSubscriberLogin", userLogin]
//         },
//         true,
//         // String(id) === "5e3f1ea72b3ff42af4eb904f"
//         userLogin
//       ]
//     },
//     role: 1,
//     subscriptions: 1,
//     firstName: 1,
//     lastName: 1,
//     email: 1,
//     phone: 1,
//     avatar: 1
//   }
// }
// .find( { subscriptions : { $eq: [ "A", "B" ] } })
// $cond: [
//   { $cmp: ["$subscriptions.responseSubscriberLogin", userLogin] },
//   "subscriber",
//   "hui"
// ]

//   $cond: {
//     if: {
//       $gte: ["$subscriptions.requestSubscriberLogin", userLogin]
//     },
//     then: `subscriber`,
//     else: false
//   }
// }
// $cond: {
//   if: {
//     $gte: ["$subscriptions.requestSubscriberLogin", userLogin]
//   },
//   then: `subscriber`,
//   else: false
// }
// $eq: ["$subscriptions.requestSubscriberLogin", userLogin]

// {
//   $addFields: {
//     subscriptions2: {
//       $filter: {
//         input: "$subscriptions.requestSubscriberLogin",
//         as: "field",
//         cond: [
//           {
//             $gte: ["$$subscriptions.requestSubscriberLogin", id]
//           }
//         ]
//       }

//       // $cond: [{ $gte: ["$$status", userLogin] }, "subscriber", false]
//     }
//   }
// }

// {
//   $addFields: {
//     subscriptions2: {
//       $let: {
//         vars: {
//           current: {
//             $cond: {
//               if: ["$subscriptions.requestSubscriberId", id],
//               then: "subscriber",
//               else: "false"
//             }
//           }
//         },
//         in: {"$$current"}
//       }
//     }
//   }
// }
