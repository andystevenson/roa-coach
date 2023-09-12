export default function Resolver(root, args, context, info) {
  console.log(
    'player/list resolver',
    JSON.stringify({ root, args, context, info }, null, 2),
  )
  return null
}
