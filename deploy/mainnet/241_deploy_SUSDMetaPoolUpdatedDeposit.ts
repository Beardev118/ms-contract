import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { execute, deploy, get, getOrNull, log, save } = deployments
  const { deployer } = await getNamedAccounts()

  // Manually check if the pool is already deployed
  const metalSUSDMetaPool = await getOrNull("metalSUSDMetaPoolUpdatedDeposit")
  if (metalSUSDMetaPool) {
    log(
      `reusing "metalSUSDMetaPoolUpdatedDeposit" at ${metalSUSDMetaPool.address}`,
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
    const metaSwapDepositAddress = newPoolEvent["args"]["cloneAddress"]
    log(
      `deployed SUSD meta pool deposit (targeting "MetaPoolDeposit") at ${metaSwapDepositAddress}`,
    )
    await save("metalSUSDMetaPoolUpdatedDeposit", {
      abi: (await get("metalSUSDMetaPoolDeposit")).abi,
      address: metaSwapDepositAddress,
    })

    await execute(
      "metalSUSDMetaPoolUpdatedDeposit",
      { from: deployer, log: true, gasLimit: 1_000_000 },
      "initialize",
      (
        await get("metalUSDPoolV2")
      ).address,
      (
        await get("metalSUSDMetaPoolUpdated")
      ).address,
      (
        await get("metalSUSDMetaPoolUpdatedLPToken")
      ).address,
    )
  }
}
export default func
func.tags = ["SUSDMetaPoolUpdatedDeposit"]
func.dependencies = ["SUSDMetaPoolTokens", "SUSDMetaPoolUpdated"]
