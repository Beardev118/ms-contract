import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { ARBITRUM_MULTISIG_ADDRESS } from "../../utils/accounts"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { execute, get, getOrNull, log, read, save } = deployments
  const { deployer } = await getNamedAccounts()

  // Manually check if the pool is already deployed
  const metalArbUSDPool = await getOrNull("metalArbUSDPool")
  if (metalArbUSDPool) {
    log(`reusing "metalArbUSDPool" at ${metalArbUSDPool.address}`)
  } else {
    // Constructor arguments
    const TOKEN_ADDRESSES = [
      (await get("nUSD")).address,
      (await get("MIM")).address,
      (await get("USDC")).address,
      (await get("USDT")).address,
    ]
    const TOKEN_DECIMALS = [18, 18, 6, 6]
    const LP_TOKEN_NAME = "metal nUSD/MIM/USDC/USDT"
    const LP_TOKEN_SYMBOL = "metalArbUSD"
    const INITIAL_A = 200
    const SWAP_FEE = 4e6 // 4bps
    const ADMIN_FEE = 0

    await execute(
      "SwapFlashLoan",
      { from: deployer, log: true },
      "initialize",
      TOKEN_ADDRESSES,
      TOKEN_DECIMALS,
      LP_TOKEN_NAME,
      LP_TOKEN_SYMBOL,
      INITIAL_A,
      SWAP_FEE,
      ADMIN_FEE,
      (
        await get("LPToken")
      ).address,
    )

    await save("metalArbUSDPool", {
      abi: (await get("SwapFlashLoan")).abi,
      address: (await get("SwapFlashLoan")).address,
    })

    const lpTokenAddress = (await read("metalArbUSDPool", "swapStorage"))
      .lpToken
    log(`metal Arbitrum USD Pool LP Token at ${lpTokenAddress}`)

    await save("metalArbUSDPoolLPToken", {
      abi: (await get("LPToken")).abi, // LPToken ABI
      address: lpTokenAddress,
    })

    await execute(
      "metalArbUSDPool",
      { from: deployer, log: true },
      "transferOwnership",
      ARBITRUM_MULTISIG_ADDRESS,
    )
  }
}
export default func
func.tags = ["metalArbUSDPool"]
func.dependencies = ["SwapUtils", "SwapFlashLoan", "USDPoolTokens"]
