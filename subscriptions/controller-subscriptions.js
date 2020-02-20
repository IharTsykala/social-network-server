const ServiceSubscription = require("./service-subscriptions")

const service = new ServiceSubscription()

class SubscriptionController {
  constructor() {}
  getAllSubscription = async (req, res) => {
    try {
      const result = await service.getAllSubscription()
      res.send(result)
    } catch (e) {
      res.status(400).send({ error: e.message })
    }
  }

  addSubscription = async (req, res) => {
    try {
      // console.log(req)
      const result = await service.addSubscription(req.body)
      res.status(201).send(result)
    } catch (e) {
      res.status(400).send({ error: e.message })
    }
  }

  getUserWithSubscriptionsById = async (req, res) => {
    try {
      const result = await service.getUserWithSubscriptionsById(req.params.id)
      res.send(result)
    } catch (e) {
      res.status(400).send({ error: e.message })
    }
  }

  getUserWithObservablesById = async (req, res) => {
    try {
      const result = await service.getUserWithObservablesById(req.params.id)
      res.send(result)
    } catch (e) {
      res.status(400).send({ error: e.message })
    }
  }
}

module.exports = SubscriptionController
