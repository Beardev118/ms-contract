import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { execute, get, getOrNull, log, read, save } = deployments
  const { deployer } = await getNamedAccounts()

  // Manually check if the pool is already deployed
  const metalBTCPoolV2 = await getOrNull("metalBTCPoolV2")
  if (metalBTCPoolV2) {
    log(`reusing "metalBTCPoolV2" at ${metalBTCPoolV2.address}`)
  } else {
    // Constructor arguments
    const TOKEN_ADDRESSES = [
      (await get("WBTC")).address,
      (await get("RENBTC")).address,
      (await get("SBTC")).address,
    ]
    const TOKEN_DECIMALS = [8, 8, 18]
    const LP_TOKEN_NAME = "metal WBTC/renBTC/sBTC"
    const LP_TOKEN_SYMBOL = "metalWRenSBTC"
    const INITIAL_A = 200
    const SWAP_FEE = 4e6 // 4bps
    const ADMIN_FEE = 0

    const receipt = await execute(
      "SwapDeployer",
      { from: deployer, log: true },
      "deploy",
      (
        await get("SwapFlashLoan")
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
    )

    const newPoolEvent = receipt?.events?.find(
      (e: any) => e["event"] == "NewSwapPool",
    )
    const btcSwapAddress = newPoolEvent["args"]["swapAddress"]
    log(`deployed BTC pool V2 (targeting "SwapFlashLoan") at ${btcSwapAddress}`)
    await save("metalBTCPoolV2", {
      abi: (await get("SwapFlashLoan")).abi,
      address: btcSwapAddress,
    })
  }

  const lpTokenAddress = (await read("metalBTCPoolV2", "swapStorage")).lpToken
  log(`BTC pool V2 LP Token at ${lpTokenAddress}`)

  await save("metalBTCPoolV2LPToken", {
    abi: (await get("WBTC")).abi, // Generic ERC20 ABI
    address: lpTokenAddress,
  })
}
export default func
func.tags = ["BTCPoolV2"]
func.dependencies = [
  "SwapUtils",
  "SwapDeployer",
  "SwapFlashLoan",
  "BTCPoolV2Tokens",
]
