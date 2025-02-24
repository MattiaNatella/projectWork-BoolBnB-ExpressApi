import express from 'express'
import bnbController from '../controllers/bnbController.js'

const router = express.Router()

//INDEX
router.get('/', bnbController.index)

//INDEX FILTRATO
router.get('/filtra',bnbController.filterIndex)

// SHOW
router.get('/:id', bnbController.show)

// STORE
router.post('/', bnbController.store)

//STORE REVIEW
router.post('/:id/recensioni', bnbController.storeReview)

// UPDATE CUORICINI
router.patch('/:id/cuoricini', bnbController.modifyVote)




export default router