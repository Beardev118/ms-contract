import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { execute, deploy, get, getOrNull, log, save } = deployments
  const { deployer } = await getNamedAccounts()

  // Manually check if the pool is already deployed
  const metalWCUSDMetaPool = await getOrNull(
    "metalWCUSDMetaPoolUpdatedDeposit",
  )
  if (metalWCUSDMetaPool) {
    log(
      `reusing "metalWCUSDMetaPoolUpdatedDeposit" at ${metalWCUSDMetaPool.address}`,
    )
  } else {
    const receipt = await execute(
      "SwapDeployer",
      {
        from: deployer,
        log: true,
      },
      "clone",
      (
        await get("metalSUSDMetaPoolDeposit")
      ).address,
    )

    const newPoolEvent = receipt?.events?.find(
      (e: any) => e["event"] == "NewClone",
    )
    const metaSwapDeposit = newPoolEvent["args"]["cloneAddress"]
    log(
      `deployed WCUSD meta pool deposit (targeting "MetaPoolDeposit") at ${metaSwapDeposit}`,
    )
    await save("metalWCUSDMetaPoolUpdatedDeposit", {
      abi: (await get("metalSUSDMetaPoolDeposit")).abi,
      address: metaSwapDeposit,
    })

    await execute(
      "metalWCUSDMetaPoolUpdatedDeposit",
      { from: deployer, log: true, gasLimit: 1_000_000 },
      "initialize",
      (
        await get("metalUSDPoolV2")
      ).address,
      (
        await get("metalWCUSDMetaPoolUpdated")
      ).address,
      (
        await get("metalWCUSDMetaPoolUpdatedLPToken")
      ).address,
    )
  }
}
export default func
func.tags = ["WCUSDMetaPoolUpdatedDeposit"]
func.dependencies = ["WCUSDMetaPoolTokens", "WCUSDMetaPoolUpdated"]
