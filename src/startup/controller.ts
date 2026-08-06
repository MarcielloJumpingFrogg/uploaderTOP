import {body, validationResult, matchedData } from "express-validator"


const userNameLenghtErr = "Username Must be between 3 and 15 characters"
const userNameAlphaErr = "Username Must only contain letters"
const passwordLenghtErr = "Password Must be between 8 and 16 characters"
const passwordStrenght = "Password Must have at least one lowerCase, one upperCase, one number and one symbol"

const validateUser = [
	body("username").trim()
	    .isAlpha().withMessage(userNameAlphaErr)
	    .isLength({min: 3, max: 15}).withMessage(userNameLenghtErr),
	body("password").trim()
	    .isLength({min:8, max: 16}).withMessage(passwordLenghtErr)
	    .isStrongPassword({
		minLength: 8,
		minLowercase: 1,
		minUppercase: 1,
		minNumbers: 1,
		minSymbols: 1,
		returnScore: false,
		pointsPerUnique: 1,
		pointsPerRepeat: 0.5,
		pointsForContainingLower: 10,
		pointsForContainingUpper: 10,
		pointsForContainingNumber: 10,
		pointsForContainingSymbol: 10,
	    }).withMessage(passwordStrenght)

]


export { validateUser }
