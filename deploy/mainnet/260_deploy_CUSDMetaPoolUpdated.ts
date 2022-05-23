import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { execute, deploy, get, getOrNull, log, read, save } = deployments
  const { deployer } = await getNamedAccounts()

  // Manually check if the pool is already deployed
  const metalWCUSDMetaPool = await getOrNull("metalWCUSDMetaPoolUpdated")
  if (metalWCUSDMetaPool) {
    log(`reusing "metalWCUSDMetaPoolUpdated" at ${metalWCUSDMetaPool.address}`)
  } else {
    // Constructor arguments
    const TOKEN_ADDRESSES = [
      (await get("WCUSD")).address,
      (await get("metalUSDPoolV2LPToken")).address,
    ]
    const TOKEN_DECIMALS = [18, 18]
    const LP_TOKEN_NAME = "metal wCUSD/metalUSD-V2"
    const LP_TOKEN_SYMBOL = "metalWCUSD"
    const INITIAL_A = 100
    const SWAP_FEE = 4e6 // 4bps
    const ADMIN_FEE = 0

    const receipt = await execute(
      "SwapDeployer",
      {
        from: deployer,
        log: true,
      },
      "deployMetaSwap",
      (
        await get("metalSUSDMetaPoolUpdated")
      ).address,
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
      (
        await get("metalUSDPoolV2")
      ).address,
    )

    const newPoolEvent = receipt?.events?.find(
      (e: any) => e["event"] == "NewSwapPool",
    )
    const metaSwapAddress = newPoolEvent["args"]["swapAddress"]
    log(`deployed CUSD meta pool (targeting "MetaSwap") at ${metaSwapAddress}`)
    await save("metalWCUSDMetaPoolUpdated", {
      abi: (await get("metalSUSDMetaPoolUpdated")).abi,
      address: metaSwapAddress,
    })
  }

  const lpTokenAddress = (
    await read("metalWCUSDMetaPoolUpdated", "swapStorage")
  ).lpToken
  log(`metal wCUSD MetaSwap LP Token at ${lpTokenAddress}`)

  await save("metalWCUSDMetaPoolUpdatedLPToken", {
    abi: (await get("LPToken")).abi, // LPToken ABI
    address: lpTokenAddress,
  })
}
export default func
func.tags = ["WCUSDMetaPoolUpdated"]
func.dependencies = [
  "WCUSDMetaPoolTokens",
  "USDPoolV2",
  "MetaSwapUtils",
  "AmplificationUtils",
]
