async function deleteToken(sql, t, { id }) {
  await sql.models.token.update(
    { deletedAt: sql.literal('CURRENT_TIMESTAMP') },
    {
      where: { id },
      transaction: t,
      logging: false,
    },
  )
}

export default deleteToken
