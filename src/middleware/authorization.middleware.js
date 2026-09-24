import { ForbiddenException } from "../common/exceptions/index.js";

/*
SINGLE
authorization(RoleEnum.ADMIN)
*/
export const authorization = (accessRole) => {
  return async (req, res, next) => {
    if (req.user.role < accessRole) {
      throw ForbiddenException({ message: "Forbidden Account" });
    }

    next();
  };
};

/*
ARRAY
authorization([RoleEnum.ADMIN ,RoleEnum.USER ])
*/
// export const authorization = (accessRoles) => {
//   return async (req, res, next) => {
//     if (!accessRoles.includes(req.user.role)) {
//       throw ForbiddenException({ message: "Forbidden Account" });
//     }

//     next();
//   };
// };

/*
BOTH APPROACHES
authorization(RoleEnum.ADMIN) //* default
authorization([RoleEnum.ADMIN ,RoleEnum.USER ] , byLevel= false)
*/
// export const authorization = (accessRoles, byLevel = true) => {
//   return async (req, res, next) => {
//     switch (byLevel) {
//       case true:
//         if (req.user.role < accessRoles) {
//           throw ForbiddenException({ message: "Forbidden Account" });
//         }
//         break;
//       default:
//         if (!accessRoles.includes(req.user.role)) {
//           throw ForbiddenException({ message: "Forbidden Account" });
//         }
//         break;
//     }

//     next();
//   };
// };
