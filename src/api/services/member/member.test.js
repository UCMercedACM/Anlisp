/* eslint-disable arrow-body-style */
/* eslint-disable no-unused-expressions */
const request = require("supertest");
const httpStatus = require("http-status");
const { expect } = require("chai");
const sinon = require("sinon");
const bcrypt = require("bcryptjs");
const { some, omitBy, isNil } = require("lodash");

const app = require("../../index");
const { Member } = require("./member.model");
const JWT_EXPIRATION = require("../../config/vars").jwtExpirationInterval;

/**
 * root level hooks
 */

async function format(member) {
  const formated = member;

  // delete password
  delete formated.password;

  // get users from database
  const dbMember = (await Member.findOne({ email: member.email })).transform();

  // remove null and undefined properties
  return omitBy(dbMember, isNil);
}

describe("Users API", async () => {
  let adminAccessToken;
  let userAccessToken;
  let dbMembers;
  let member;
  let admin;

  const password = "123456";
  const passwordHashed = await bcrypt.hash(password, 1);

  beforeEach(async () => {
    dbMembers = {
      branStark: {
        email: "branstark@gmail.com",
        password: passwordHashed,
        name: "Bran Stark",
        role: "admin",
      },
      jonSnow: {
        email: "jonsnow@gmail.com",
        password: passwordHashed,
        name: "Jon Snow",
      },
    };

    member = {
      email: "sousa.dfs@gmail.com",
      password,
      name: "Daniel Sousa",
    };

    admin = {
      email: "sousa.dfs@gmail.com",
      password,
      name: "Daniel Sousa",
      role: "admin",
    };

    await Member.remove({});
    await Member.insertMany([dbMembers.branStark, dbMembers.jonSnow]);
    dbMembers.branStark.password = password;
    dbMembers.jonSnow.password = password;
    adminAccessToken = (await Member.findAndGenerateToken(dbMembers.branStark))
      .accessToken;
    userAccessToken = (await Member.findAndGenerateToken(dbMembers.jonSnow))
      .accessToken;
  });

  describe("POST /v1/users", () => {
    it("should create a new member when request is ok", () => {
      return request(app)
        .post("/v1/users")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(admin)
        .expect(httpStatus.CREATED)
        .then((res) => {
          delete admin.password;
          expect(res.body).to.include(admin);
        });
    });

    it('should create a new member and set default role to "member"', () => {
      return request(app)
        .post("/v1/users")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(member)
        .expect(httpStatus.CREATED)
        .then((res) => {
          expect(res.body.role).to.be.equal("member");
        });
    });

    it("should report error when email already exists", () => {
      member.email = dbMembers.branStark.email;

      return request(app)
        .post("/v1/users")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(member)
        .expect(httpStatus.CONFLICT)
        .then((res) => {
          const { field } = res.body.errors[0];
          const { location } = res.body.errors[0];
          const { messages } = res.body.errors[0];
          expect(field).to.be.equal("email");
          expect(location).to.be.equal("body");
          expect(messages).to.include('"email" already exists');
        });
    });

    it("should report error when email is not provided", () => {
      delete member.email;

      return request(app)
        .post("/v1/users")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(member)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const { field } = res.body.errors[0];
          const { location } = res.body.errors[0];
          const { messages } = res.body.errors[0];
          expect(field).to.be.equal("email");
          expect(location).to.be.equal("body");
          expect(messages).to.include('"email" is required');
        });
    });

    it("should report error when password length is less than 6", () => {
      member.password = "12345";

      return request(app)
        .post("/v1/users")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(member)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const { field } = res.body.errors[0];
          const { location } = res.body.errors[0];
          const { messages } = res.body.errors[0];
          expect(field).to.be.equal("password");
          expect(location).to.be.equal("body");
          expect(messages).to.include(
            '"password" length must be at least 6 characters long'
          );
        });
    });

    it("should report error when logged member is not an admin", () => {
      return request(app)
        .post("/v1/users")
        .set("Authorization", `Bearer ${userAccessToken}`)
        .send(member)
        .expect(httpStatus.FORBIDDEN)
        .then((res) => {
          expect(res.body.code).to.be.equal(httpStatus.FORBIDDEN);
          expect(res.body.message).to.be.equal("Forbidden");
        });
    });
  });

  describe("GET /v1/users", () => {
    it("should get all users", () => {
      return request(app)
        .get("/v1/users")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK)
        .then(async (res) => {
          const bran = format(dbMembers.branStark);
          const john = format(dbMembers.jonSnow);

          const includesBranStark = some(res.body, bran);
          const includesjonSnow = some(res.body, john);

          // before comparing it is necessary to convert String to Date
          res.body[0].createdAt = new Date(res.body[0].createdAt);
          res.body[1].createdAt = new Date(res.body[1].createdAt);

          expect(res.body).to.be.an("array");
          expect(res.body).to.have.lengthOf(2);
          expect(includesBranStark).to.be.true;
          expect(includesjonSnow).to.be.true;
        });
    });

    it("should get all users with pagination", () => {
      return request(app)
        .get("/v1/users")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .query({ page: 2, perPage: 1 })
        .expect(httpStatus.OK)
        .then((res) => {
          delete dbMembers.jonSnow.password;
          const john = format(dbMembers.jonSnow);
          const includesjonSnow = some(res.body, john);

          // before comparing it is necessary to convert String to Date
          res.body[0].createdAt = new Date(res.body[0].createdAt);

          expect(res.body).to.be.an("array");
          expect(res.body).to.have.lengthOf(1);
          expect(includesjonSnow).to.be.true;
        });
    });

    it("should filter users", () => {
      return request(app)
        .get("/v1/users")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .query({ email: dbMembers.jonSnow.email })
        .expect(httpStatus.OK)
        .then((res) => {
          delete dbMembers.jonSnow.password;
          const john = format(dbMembers.jonSnow);
          const includesjonSnow = some(res.body, john);

          // before comparing it is necessary to convert String to Date
          res.body[0].createdAt = new Date(res.body[0].createdAt);

          expect(res.body).to.be.an("array");
          expect(res.body).to.have.lengthOf(1);
          expect(includesjonSnow).to.be.true;
        });
    });

    it("should report error when pagination's parameters are not a number", () => {
      return request(app)
        .get("/v1/users")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .query({ page: "?", perPage: "whaat" })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const { field } = res.body.errors[0];
          const { location } = res.body.errors[0];
          const { messages } = res.body.errors[0];
          expect(field).to.be.equal("page");
          expect(location).to.be.equal("query");
          expect(messages).to.include('"page" must be a number');
          return Promise.resolve(res);
        })
        .then((res) => {
          const { field } = res.body.errors[1];
          const { location } = res.body.errors[1];
          const { messages } = res.body.errors[1];
          expect(field).to.be.equal("perPage");
          expect(location).to.be.equal("query");
          expect(messages).to.include('"perPage" must be a number');
        });
    });

    it("should report error if logged member is not an admin", () => {
      return request(app)
        .get("/v1/users")
        .set("Authorization", `Bearer ${userAccessToken}`)
        .expect(httpStatus.FORBIDDEN)
        .then((res) => {
          expect(res.body.code).to.be.equal(httpStatus.FORBIDDEN);
          expect(res.body.message).to.be.equal("Forbidden");
        });
    });
  });

  describe("GET /v1/users/:userId", () => {
    it("should get member", async () => {
      const id = (await Member.findOne({}))._id;
      delete dbMembers.branStark.password;

      return request(app)
        .get(`/v1/users/${id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.include(dbMembers.branStark);
        });
    });

    it('should report error "Member does not exist" when member does not exists', () => {
      return request(app)
        .get("/v1/users/56c787ccc67fc16ccc1a5e92")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.code).to.be.equal(404);
          expect(res.body.message).to.be.equal("Member does not exist");
        });
    });

    it('should report error "Member does not exist" when id is not a valid ObjectID', () => {
      return request(app)
        .get("/v1/users/palmeiras1914")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.code).to.be.equal(404);
          expect(res.body.message).to.equal("Member does not exist");
        });
    });

    it("should report error when logged member is not the same as the requested one", async () => {
      const id = (await Member.findOne({ email: dbMembers.branStark.email }))._id;

      return request(app)
        .get(`/v1/users/${id}`)
        .set("Authorization", `Bearer ${userAccessToken}`)
        .expect(httpStatus.FORBIDDEN)
        .then((res) => {
          expect(res.body.code).to.be.equal(httpStatus.FORBIDDEN);
          expect(res.body.message).to.be.equal("Forbidden");
        });
    });
  });

  describe("PUT /v1/users/:userId", () => {
    it("should replace member", async () => {
      delete dbMembers.branStark.password;
      const id = (await Member.findOne(dbMembers.branStark))._id;

      return request(app)
        .put(`/v1/users/${id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(member)
        .expect(httpStatus.OK)
        .then((res) => {
          delete member.password;
          expect(res.body).to.include(member);
          expect(res.body.role).to.be.equal("member");
        });
    });

    it("should report error when email is not provided", async () => {
      const id = (await Member.findOne({}))._id;
      delete member.email;

      return request(app)
        .put(`/v1/users/${id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(member)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const { field } = res.body.errors[0];
          const { location } = res.body.errors[0];
          const { messages } = res.body.errors[0];
          expect(field).to.be.equal("email");
          expect(location).to.be.equal("body");
          expect(messages).to.include('"email" is required');
        });
    });

    it("should report error member when password length is less than 6", async () => {
      const id = (await Member.findOne({}))._id;
      member.password = "12345";

      return request(app)
        .put(`/v1/users/${id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(member)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const { field } = res.body.errors[0];
          const { location } = res.body.errors[0];
          const { messages } = res.body.errors[0];
          expect(field).to.be.equal("password");
          expect(location).to.be.equal("body");
          expect(messages).to.include(
            '"password" length must be at least 6 characters long'
          );
        });
    });

    it('should report error "Member does not exist" when member does not exists', () => {
      return request(app)
        .put("/v1/users/palmeiras1914")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.code).to.be.equal(404);
          expect(res.body.message).to.be.equal("Member does not exist");
        });
    });

    it("should report error when logged member is not the same as the requested one", async () => {
      const id = (await Member.findOne({ email: dbMembers.branStark.email }))._id;

      return request(app)
        .put(`/v1/users/${id}`)
        .set("Authorization", `Bearer ${userAccessToken}`)
        .expect(httpStatus.FORBIDDEN)
        .then((res) => {
          expect(res.body.code).to.be.equal(httpStatus.FORBIDDEN);
          expect(res.body.message).to.be.equal("Forbidden");
        });
    });

    it("should not replace the role of the member (not admin)", async () => {
      const id = (await Member.findOne({ email: dbMembers.jonSnow.email }))._id;
      const role = "admin";

      return request(app)
        .put(`/v1/users/${id}`)
        .set("Authorization", `Bearer ${userAccessToken}`)
        .send(admin)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.role).to.not.be.equal(role);
        });
    });

    it("should not assign the already existing email", async () => {
      delete dbMembers.branStark.password;
      const id = (await Member.findOne(dbMembers.branStark))._id;
      member.email = dbMembers.jonSnow.email;
      return request(app)
        .put(`/v1/users/${id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(member)
        .expect(httpStatus.CONFLICT)
        .then((res) => {
          const { field } = res.body.errors[0];
          const { location } = res.body.errors[0];
          const { messages } = res.body.errors[0];
          expect(field).to.be.equal("email");
          expect(location).to.be.equal("body");
          expect(messages).to.include('"email" already exists');
        });
    });
  });

  describe("PATCH /v1/users/:userId", () => {
    it("should update member", async () => {
      delete dbMembers.branStark.password;
      const id = (await Member.findOne(dbMembers.branStark))._id;
      const { name } = member;

      return request(app)
        .patch(`/v1/users/${id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send({ name })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.name).to.be.equal(name);
          expect(res.body.email).to.be.equal(dbMembers.branStark.email);
        });
    });

    it("should not update member when no parameters were given", async () => {
      delete dbMembers.branStark.password;
      const id = (await Member.findOne(dbMembers.branStark))._id;

      return request(app)
        .patch(`/v1/users/${id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.include(dbMembers.branStark);
        });
    });

    it('should report error "Member does not exist" when member does not exists', () => {
      return request(app)
        .patch("/v1/users/palmeiras1914")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.code).to.be.equal(404);
          expect(res.body.message).to.be.equal("Member does not exist");
        });
    });

    it("should report error when logged member is not the same as the requested one", async () => {
      const id = (await Member.findOne({ email: dbMembers.branStark.email }))._id;

      return request(app)
        .patch(`/v1/users/${id}`)
        .set("Authorization", `Bearer ${userAccessToken}`)
        .expect(httpStatus.FORBIDDEN)
        .then((res) => {
          expect(res.body.code).to.be.equal(httpStatus.FORBIDDEN);
          expect(res.body.message).to.be.equal("Forbidden");
        });
    });

    it("should not update the role of the member (not admin)", async () => {
      const id = (await Member.findOne({ email: dbMembers.jonSnow.email }))._id;
      const role = "admin";

      return request(app)
        .patch(`/v1/users/${id}`)
        .set("Authorization", `Bearer ${userAccessToken}`)
        .send({ role })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.role).to.not.be.equal(role);
        });
    });

    it("should not assign the already existing email", async () => {
      delete dbMembers.branStark.password;
      const id = (await Member.findOne(dbMembers.branStark))._id;
      member.email = dbMembers.jonSnow.email;
      return request(app)
        .patch(`/v1/users/${id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(member)
        .expect(httpStatus.CONFLICT)
        .then((res) => {
          const { field } = res.body.errors[0];
          const { location } = res.body.errors[0];
          const { messages } = res.body.errors[0];
          expect(field).to.be.equal("email");
          expect(location).to.be.equal("body");
          expect(messages).to.include('"email" already exists');
        });
    });
  });

  describe("DELETE /v1/users", () => {
    it("should delete member", async () => {
      const id = (await Member.findOne({}))._id;

      return request(app)
        .delete(`/v1/users/${id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NO_CONTENT)
        .then(() => request(app).get("/v1/users"))
        .then(async () => {
          const users = await Member.find({});
          expect(users).to.have.lengthOf(1);
        });
    });

    it('should report error "Member does not exist" when member does not exists', () => {
      return request(app)
        .delete("/v1/users/palmeiras1914")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.code).to.be.equal(404);
          expect(res.body.message).to.be.equal("Member does not exist");
        });
    });

    it("should report error when logged member is not the same as the requested one", async () => {
      const id = (await Member.findOne({ email: dbMembers.branStark.email }))._id;

      return request(app)
        .delete(`/v1/users/${id}`)
        .set("Authorization", `Bearer ${userAccessToken}`)
        .expect(httpStatus.FORBIDDEN)
        .then((res) => {
          expect(res.body.code).to.be.equal(httpStatus.FORBIDDEN);
          expect(res.body.message).to.be.equal("Forbidden");
        });
    });
  });

  describe("GET /v1/users/profile", () => {
    it("should get the logged member's info", () => {
      delete dbMembers.jonSnow.password;

      return request(app)
        .get("/v1/users/profile")
        .set("Authorization", `Bearer ${userAccessToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.include(dbMembers.jonSnow);
        });
    });

    it("should report error without stacktrace when accessToken is expired", async () => {
      // fake time
      const clock = sinon.useFakeTimers();
      const expiredAccessToken = (
        await Member.findAndGenerateToken(dbMembers.branStark)
      ).accessToken;

      // move clock forward by minutes set in config + 1 minute
      clock.tick(JWT_EXPIRATION * 60000 + 60000);

      return request(app)
        .get("/v1/users/profile")
        .set("Authorization", `Bearer ${expiredAccessToken}`)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.code).to.be.equal(httpStatus.UNAUTHORIZED);
          expect(res.body.message).to.be.equal("jwt expired");
          expect(res.body).to.not.have.a.property("stack");
        });
    });
  });

  describe("GET /v1/not-found", () => {
    it("should return 404", () => {
      return request(app).get("/v1/not-found").expect(httpStatus.NOT_FOUND);
    });
  });
});
