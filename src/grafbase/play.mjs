const HOF = ({ type, min: defaultMin, max: defaultMax }) => {
  return ({ min, max, id, oid } = {}) => {
    if (min === undefined) min = defaultMin
    if (max === undefined) max = defaultMax
    console.log({ type, min, max, id, oid })
  }
}

let fn = HOF({ type: 'Coach', min: 1, max: 2 })
fn()
fn({ min: 3, max: 5, id: 'coach_XXX' })
