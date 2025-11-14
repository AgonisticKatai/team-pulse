import { randomUUID } from 'node:crypto'
import 'dotenv/config'
import { User } from '../domain/models/User.js'
import { hashPassword } from '../infrastructure/auth/password-utils.js'
import { validateEnv } from '../infrastructure/config/env.js'
import { createDatabase } from '../infrastructure/database/connection.js'
import { DrizzleUserRepository } from '../infrastructure/database/repositories/DrizzleUserRepository.js'

/**
 * Seed script to create the initial SUPER_ADMIN user
 *
 * This script will:
 * 1. Check if any users exist
 * 2. If no users exist, create a SUPER_ADMIN user
 * 3. Output the credentials for first login
 *
 * Usage:
 *   pnpm tsx src/scripts/seedSuperAdmin.ts
 *
 * Environment variables required:
 *   DATABASE_URL - PostgreSQL connection string
 *   SUPER_ADMIN_EMAIL (optional) - Email for the super admin (default: admin@teampulse.com)
 *   SUPER_ADMIN_PASSWORD (optional) - Password for the super admin (default: Admin123!)
 */

async function seedSuperAdmin() {
  console.log('🌱 Starting SUPER_ADMIN seed script...')

  try {
    // 1. Validate environment
    const env = validateEnv()
    console.log('✅ Environment validated')

    // 2. Connect to database
    const db = createDatabase(env.DATABASE_URL)
    const userRepository = new DrizzleUserRepository(db)
    console.log('✅ Database connected')

    // 3. Check if users exist
    const userCountResult = await userRepository.count()

    if (!userCountResult.ok) {
      throw new Error(`Failed to count users: ${userCountResult.error.message}`)
    }

    console.log(`📊 Current user count: ${userCountResult.value}`)

    if (userCountResult.value > 0) {
      console.log('⚠️  Users already exist. Skipping seed.')
      console.log('ℹ️  If you want to create a new SUPER_ADMIN, use the /api/users endpoint')
      process.exit(0)
    }

    // 4. Get admin credentials from environment or use defaults
    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@teampulse.com'
    const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin123!'

    console.log(`👤 Creating SUPER_ADMIN user with email: ${email}`)

    // 5. Hash password
    const passwordHash = await hashPassword(password)

    // 6. Create user entity
    const userResult = User.create({
      email,
      id: randomUUID(),
      passwordHash,
      role: 'SUPER_ADMIN',
    })

    if (!userResult.ok) {
      throw new Error(`Failed to create SUPER_ADMIN user: ${userResult.error.message}`)
    }

    // 7. Save to database
    await userRepository.save({ user: userResult.value })

    console.log('✅ SUPER_ADMIN user created successfully!')
    console.log('')
    console.log('🔐 Credentials for first login:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`   Email:    ${email}`)
    console.log(`   Password: ${password}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log('⚠️  IMPORTANT: Change this password after first login!')
    console.log('')
    console.log('🎉 Seed completed successfully!')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

// Run the seed
seedSuperAdmin()
