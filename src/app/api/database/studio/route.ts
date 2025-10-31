import fs from 'fs'
import path from 'path'
import { spawn, type ChildProcess, type SpawnOptions } from 'child_process'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

let studioProcess: ChildProcess | null = null
let studioUrl: string | null = null

const READY_PATTERNS = ['Prisma Studio is up', 'Studio is up on', 'Studio started', 'Studio is running']

function isProcessRunning(child: ChildProcess | null): child is ChildProcess {
  return Boolean(child && !child.killed && child.exitCode === null)
}

function buildStudioUrl(port: number, host: string) {
  return `http://${host}:${port}`
}

async function launchPrismaStudio(): Promise<{ url: string }> {
  const port = Number(process.env.PRISMA_STUDIO_PORT ?? '5555')
  const host = process.env.PRISMA_STUDIO_HOST ?? '127.0.0.1'
  const url = buildStudioUrl(port, host)

  if (isProcessRunning(studioProcess) && studioUrl) {
    return { url: studioUrl }
  }

  return new Promise((resolve, reject) => {
    const studioArgs = ['studio', '--browser', 'none', '--port', String(port)]
    const { command, args, options } = resolvePrismaSpawnOptions(studioArgs)

    const child = spawn(command, args, options)

    studioProcess = child
    studioUrl = url

    let resolved = false

    const resolveSuccess = () => {
      if (resolved) return
      resolved = true
      resolve({ url })
    }

    const resolveFailure = (message: string) => {
      if (resolved) return
      resolved = true
      reject(new Error(message))
    }

    child.stdout?.on('data', (chunk: Buffer) => {
      const text = chunk.toString()
      if (READY_PATTERNS.some((pattern) => text.includes(pattern))) {
        resolveSuccess()
      }
    })

    child.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString()
      console.error('[prisma-studio]', text.trim())
    })

    child.once('error', (error) => {
      studioProcess = null
      studioUrl = null
      resolveFailure(`Failed to launch Prisma Studio: ${error.message}`)
    })

    child.once('exit', (code) => {
      const exitCode = code ?? -1
      const message = `Prisma Studio exited with code ${exitCode}`
      studioProcess = null
      studioUrl = null
      if (!resolved) {
        resolveFailure(message)
      }
    })

    // Fallback timeout in case we never see the ready message
    setTimeout(resolveSuccess, 5000)
  })
}

if (typeof process !== 'undefined') {
  process.on('exit', () => {
    if (isProcessRunning(studioProcess)) {
      studioProcess.kill()
    }
  })
}

export async function POST() {
  try {
    const result = await launchPrismaStudio()
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to launch Prisma Studio'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function resolvePrismaSpawnOptions(studioArgs: string[]): {
  command: string
  args: string[]
  options: SpawnOptions
} {
  const cwd = process.cwd()
  const env = process.env
  const isWindows = process.platform === 'win32'
  const stdio: SpawnOptions['stdio'] = ['ignore', 'pipe', 'pipe']

  const prismaBinary = path.join(
    cwd,
    'node_modules',
    '.bin',
    isWindows ? 'prisma.cmd' : 'prisma'
  )

  if (fs.existsSync(prismaBinary)) {
    if (isWindows) {
      return {
        command: 'cmd.exe',
        args: ['/c', prismaBinary, ...studioArgs],
        options: {
          cwd,
          env,
          stdio,
          windowsHide: true
        }
      }
    }

    return {
      command: prismaBinary,
      args: studioArgs,
      options: {
        cwd,
        env,
        stdio,
        windowsHide: true
      }
    }
  }

  const command = isWindows ? 'cmd.exe' : 'npx'
  const args = isWindows ? ['/c', 'npx', 'prisma', ...studioArgs] : ['prisma', ...studioArgs]
  const options: SpawnOptions = {
    cwd,
    env,
    stdio,
    windowsHide: true
  }

  return { command, args, options }
}
