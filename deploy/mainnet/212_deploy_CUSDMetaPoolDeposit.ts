import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { execute, deploy, get, getOrNull, log } = deployments
  const { deployer } = await getNamedAccounts()

  // Manually check if the pool is already deployed
  const metalWCUSDMetaPool = await getOrNull("metalWCUSDMetaPoolDeposit")
  if (metalWCUSDMetaPool) {
    log(
      `reusing "metalWCUSDMetaPoolDeposit" at ${metalWCUSDMetaPool.address}`,
    )
  } else {
    await deploy("metalWCUSDMetaPoolDeposit", {
      from: deployer,
      log: true,
      contract: "MetaSwapDeposit",
      skipIfAlreadyDeployed: true,
    })

    await execute(
      "metalWCUSDMetaPoolDeposit",
      { from: deployer, log: true },
      "initialize",
      (
        await get("metalUSDPoolV2")
      ).address,
      (
        await get("metalWCUSDMetaPool")
      ).address,
      (
        await get("metalWCUSDMetaPoolLPToken")
      ).address,
    )
  }
}
export default func
func.tags = ["WCUSDMetaPoolDeposit"]
func.dependencies = ["WCUSDMetaPoolTokens", "WCUSDMetaPool"]
