import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre
  const { execute, deploy, get, getOrNull, log, save } = deployments
  const { deployer } = await getNamedAccounts()

  // Manually check if the pool is already deployed
  const metalTBTCMetaPoolDeposit = await getOrNull(
    "metalTBTCMetaPoolUpdatedDeposit",
  )
  if (metalTBTCMetaPoolDeposit) {
    log(
      `reusing "metalTBTCMetaPoolUpdatedDeposit" at ${metalTBTCMetaPoolDeposit.address}`,
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
      `deployed TBTC meta pool deposit (targeting "MetaPoolDeposit") at ${metaSwapDeposit}`,
    )
    await save("metalTBTCMetaPoolUpdatedDeposit", {
      abi: (await get("metalSUSDMetaPoolDeposit")).abi,
      address: metaSwapDeposit,
    })

    await execute(
      "metalTBTCMetaPoolUpdatedDeposit",
      { from: deployer, log: true, gasLimit: 1_000_000 },
      "initialize",
      (
        await get("metalBTCPoolV2")
      ).address,
      (
        await get("metalTBTCMetaPoolUpdated")
      ).address,
      (
        await get("metalTBTCMetaPoolUpdatedLPToken")
      ).address,
    )
  }
}
export default func
func.tags = ["TBTCMetaPoolUpdatedDeposit"]
func.dependencies = ["TBTCMetaPoolTokens", "TBTCMetaPoolUpdated"]
