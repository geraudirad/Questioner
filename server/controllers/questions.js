import moment from 'moment';

import { validator, validationErrors } from '../helpers/index';
import db from '../models/db';

const Questions = {
    /**
     * Add upvotevote to question of a Meetup
     * @param {object} req
     * @param {object} res
     * @returns {object} Question object
     */
    async upvoteQuestion(req, res) {
        const findUpvoteQuery = 'SELECT * FROM questionvoters WHERE userid = $1 AND questionid = $2 AND votetype = $3';
        const upvoteResult = await db.query(findUpvoteQuery, [req.user.id, req.params.id, 'upvote']);
        const userUpvoteData = upvoteResult.rows;
        if (userUpvoteData[0]) {
            return res.status(409).send({
                status: 409,
                error: 'Question already voted',
            });
        }

        const recordVoter = 'INSERT INTO questionvoters(userid, questionid, votetype) VALUES($1, $2, $3)';
        await db.query(recordVoter, [req.user.id, req.params.id, 'upvote']);

        const text = 'UPDATE questions SET upvotes = upvotes + 1 WHERE id = $1';
        const values = [req.params.id];
        try {
            const findQuestionQuery = 'SELECT * FROM questions WHERE id=$1';
            const questionResult = await db.query(findQuestionQuery, [req.params.id]);
            const questionData = questionResult.rows;
            if (!questionData[0]) {
                return res.status(404).send({
                    status: 404,
                    error: 'Question with given ID was not found',
                });
            }

            const meetupID = questionData[0].meetupid;
            const findMeetupQuery = 'SELECT * FROM meetups WHERE id=$1';
            const meetupResult = await db.query(findMeetupQuery, [meetupID]);
            const meetupData = meetupResult.rows;
            if (!meetupData[0]) {
                return res.status(404).send({
                    status: 404,
                    error: 'Meetup associated to question was not found',
                });
            }


            await db.query(text, values);
            const response = {
                status: 201,
                data: [{
                    meetup: meetupData[0].topic,
                    questionTitle: questionData[0].title,
                    questionBody: questionData[0].body,
                }],
            };
            return res.status(201).send(response);
        } catch (errorMessage) {
            return res.status(500).send({ status: 500, error: errorMessage });
        }
    },
    /**
     * Add upvotevote to question of a Meetup
     * @param {object} req
     * @param {object} res
     * @returns {object} Question object
     */
    async downvoteQuestion(req, res) {
        const findUpvoteQuery = 'SELECT * FROM questionVoters WHERE userid = $1 AND questionid = $2';
        const upvoteResult = await db.query(findUpvoteQuery, [req.user.id, req.params.id]);
        const userUpvoteData = upvoteResult.rows;
        if (userUpvoteData[0]) {
            return res.status(409).send({
                status: 409,
                error: 'Question already voted',
            });
        }

        const recordVoter = 'INSERT INTO questionVoters(userid, questionid, votetype) VALUES($1, $2, $3)';
        await db.query(recordVoter, [req.user.id, req.params.id, 'downvote']);

        const text = 'UPDATE questions SET downvotes = downvotes + 1 WHERE id = $1';
        const values = [req.params.id];
        try {
            const findQuestionQuery = 'SELECT * FROM questions WHERE id=$1';
            const questionResult = await db.query(findQuestionQuery, [req.params.id]);
            const questionData = questionResult.rows;
            if (!questionData[0]) {
                return res.status(404).send({
                    status: 404,
                    error: 'Question with given ID was not found',
                });
            }

            const meetupID = questionData[0].meetupid;
            const findMeetupQuery = 'SELECT * FROM meetups WHERE id=$1';
            const meetupResult = await db.query(findMeetupQuery, [meetupID]);
            const meetupData = meetupResult.rows;
            if (!meetupData[0]) {
                return res.status(404).send({
                    status: 404,
                    error: 'Meetup associated to question was not found',
                });
            }


            await db.query(text, values);
            const response = {
                status: 201,
                data: [{
                    meetup: meetupData[0].topic,
                    questionTitle: questionData[0].title,
                    questionBody: questionData[0].body,
                }],
            };
            return res.status(201).send(response);
        } catch (errorMessage) {
            return res.status(500).send({ status: 500, error: errorMessage });
        }
    },
    /**
     * Add comment to Question
     * @param {object} req
     * @param {object} res
     * @returns {object} Comment object
     */
    async addComment(req, res) {
        const { error } = validator('comment', req.body);
        if (error) {
            return validationErrors(res, error);
        }
        const text = 'INSERT INTO questioncomments(questionid, userid, comment, createdon) VALUES($1, $2, $3, $4) returning *';
        const values = [
            req.params.id,
            req.user.id,
            req.body.comment,
            moment().format('YYYY-MM-DD'),
        ];
        try {
            const findOneQuery = 'SELECT * FROM questions WHERE id=$1';
            const questionResult = await db.query(findOneQuery, [req.params.id]);
            const questionData = questionResult.rows;
            if (!questionData[0]) {
                return res.status(404).send({
                    status: 404,
                    error: 'Question with given ID was not found',
                });
            }

            const findUserQuery = 'SELECT * FROM users WHERE id=$1';
            const userResult = await db.query(findUserQuery, [req.user.id]);
            const userData = userResult.rows;
            if (!userData[0]) {
                return res.status(404).send({
                    status: 404,
                    error: 'User with given ID was not found',
                });
            }

            const { title } = questionData[0];
            const { rows } = await db.query(text, values);
            const response = {
                status: 201,
                data: [{
                    id: rows[0].id,
                    comment: req.body.comment,
                    title,
                    createdon: moment().format('YYYY-MM-DD'),
                }],
            };
            return res.status(201).send(response);
        } catch (errorMessage) {
            return res.status(500).send({ status: 500, error: errorMessage });
        }
    },
    /**
     * Get Specific Meetup comments
     * @param {object} req
     * @param {object} res
     * @returns {object} comments object
     */
    async getComments(req, res) {
        const text = 'SELECT users.firstname, users.lastname, users.othername, questioncomments.comment, questioncomments.createdon FROM users, questioncomments WHERE questioncomments.id = $1 AND questioncomments.userid = users.id';
        try {
            const { rows } = await db.query(text, [req.params.id]);
            if (!rows[0]) {
                return res.status(404).send({
                    status: 404,
                    error: 'Comment with given ID was not found',
                });
            }
            const response = {
                status: 200,
                data: rows[0],
            };
            return res.status(200).send(response);
        } catch (error) {
            return res.status(500).send({ status: 500, error });
        }
    },
    /**
     * Delete a Comment
     * @param {object} req
     * @param {object} res
     * @returns {object} Comment object
     */
    async deleteComment(req, res) {
        const text = 'DELETE FROM questioncomments WHERE id = $1 returning *';
        try {
            const { rows } = await db.query(text, [req.params.commentid]);
            if (!rows[0]) {
              return res.status(404).send({
                status: 404,
                error: 'Comment with given ID was not found',
            });
            }
            return res.status(204).send({
                status: 204,
                data: 'Comment deleted',
            });
          } catch (errorMessage) {
            return res.status(500).send({ status: 500, error: errorMessage });
        }
    },
    /**
     * Add upvotevote to question of a Meetup
     * @param {object} req
     * @param {object} res
     * @returns {object} Question object
     */
    async updateComment(req, res) {
        const { error } = validator('updateComment', req.body);
        if (error) {
            return validationErrors(res, error);
        }
        const text = 'UPDATE questioncomments SET comment = $1 WHERE id = $2';
        try {
            const findCommentQuery = 'SELECT * FROM questioncomments WHERE id=$1';
            const questionResult = await db.query(findCommentQuery, [req.params.commentid]);
            const commentData = questionResult.rows;
            if (!commentData[0]) {
                return res.status(404).send({
                    status: 404,
                    error: 'Comment with given ID was not found',
                });
            }

            await db.query(text, [req.body.comment, req.params.commentid]);
            const response = {
                status: 200,
                data: [{
                    comment: req.body.comment,
                    createdon: commentData[0].createdon,
                }],
            };
            return res.status(200).send(response);
        } catch (errorMessage) {
            return res.status(500).send({ status: 500, error: errorMessage });
        }
    },
    /**
     * Add upvotevote to question of a Meetup
     * @param {object} req
     * @param {object} res
     * @returns {object} Question object
     */
    async updateQuestion(req, res) {
        const { error } = validator('updateQuestion', req.body);
        if (error) {
            return validationErrors(res, error);
        }
        const text = 'UPDATE questions SET title = $1, body = $2 WHERE id = $3';
        try {
            const findQuestionQuery = 'SELECT * FROM questions WHERE id=$1';
            const questionResult = await db.query(findQuestionQuery, [req.params.id]);
            const questionData = questionResult.rows;
            if (!questionData[0]) {
                return res.status(404).send({
                    status: 404,
                    error: 'Question with given ID was not found',
                });
            }

            const meetupID = questionData[0].meetupid;
            const findMeetupQuery = 'SELECT * FROM meetups WHERE id=$1';
            const meetupResult = await db.query(findMeetupQuery, [meetupID]);
            const meetupData = meetupResult.rows;
            if (!meetupData[0]) {
                return res.status(404).send({
                    status: 404,
                    error: 'Meetup associated to question was not found',
                });
            }

            await db.query(text, [req.body.title, req.body.body, req.params.id]);
            const response = {
                status: 200,
                data: [{
                    meetup: meetupData[0].topic,
                    questionTitle: req.body.title,
                    questionBody: req.body.body,
                }],
            };
            return res.status(200).send(response);
        } catch (errorMessage) {
            return res.status(500).send({ status: 500, error: errorMessage });
        }
    },
    /**
     * Delete a Question
     * @param {object} req
     * @param {object} res
     * @returns {object} Question object
     */
    async deleteQuestion(req, res) {
        const text = 'DELETE FROM questions WHERE id = $1 returning *';
        try {
            const { rows } = await db.query(text, [req.params.id]);
            if (!rows[0]) {
              return res.status(404).send({
                status: 404,
                error: 'Question with given ID was not found',
            });
            }
            return res.status(204).send({
                status: 204,
                data: 'Question deleted',
            });
          } catch (errorMessage) {
            return res.status(500).send({ status: 500, error: errorMessage });
        }
    },
};
export default Questions;
